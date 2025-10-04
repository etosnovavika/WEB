package server.worker;

import server.fcgi.Util;
import server.fcgi.ValidationException;
import server.fcgi.Worker;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Properties;

public final class CoordinatesValidator extends Worker<ValidateCoordinatesRequest, ValidateCoordinatesResponse> {

    // текущие допустимые диапазоны
    private static double RANGE_X_MIN = -5;
    private static double RANGE_X_MAX = 3;
    private static double RANGE_R = 2; // одно значение R, по умолчанию

    @Override
    protected ValidateCoordinatesResponse process(ValidateCoordinatesRequest request) {
        final long start = System.nanoTime();
        return new ValidateCoordinatesResponse(
                request.x(), request.y(), request.r(),
                CoordinatesChecker.checkCoordinates(request),
                System.nanoTime() - start
        );
    }

    @Override
    public ValidateCoordinatesRequest encode(Properties params) throws ValidationException {
        // --- режим установки диапазона ---
        if (params.containsKey("xMin") && params.containsKey("xMax") && params.containsKey("r")) {
            String sxMin = params.getProperty("xMin", "").trim();
            String sxMax = params.getProperty("xMax", "").trim();
            String sr = params.getProperty("r", "").trim();

            double xMin;
            double xMax;
            double r;
            try {
                xMin = Double.parseDouble(sxMin);
                xMax = Double.parseDouble(sxMax);
                r = Double.parseDouble(sr);
            } catch (NumberFormatException e) {
                throw new ValidationException("Range parameters must be valid numbers.");
            }

            if (!Double.isFinite(xMin) || !Double.isFinite(xMax) || !Double.isFinite(r)) {
                throw new ValidationException("Range parameters must be finite numbers.");
            }

            if (xMin >= xMax) throw new ValidationException("xMin must be less than xMax.");
            if (r <= 0) throw new ValidationException("R must be greater than 0.");



            RANGE_X_MIN = xMin;
            RANGE_X_MAX = xMax;
            RANGE_R = r;

            System.out.printf("Updated ranges: X=[%.2f, %.2f], R=%.2f%n", RANGE_X_MIN, RANGE_X_MAX, RANGE_R);

            // возвращаем "пустой" запрос
            return new ValidateCoordinatesRequest(0.0, 0.0, 0.0);
        }

        // --- обычная точка ---
        String sx = params.getProperty("x", "").trim();
        String syRaw = params.getProperty("y", "").trim();
        String sr = params.getProperty("r", "").trim();

        if (sx.isEmpty() || syRaw.isEmpty() || sr.isEmpty()) {
            throw new ValidationException("Missing parameters: x, y and r are required.");
        }

        double x, y, r;
        try {
            x = Double.parseDouble(sx);
        } catch (NumberFormatException e) {
            throw new ValidationException("X must be a number.");
        }

        try {
            r = Double.parseDouble(sr);
        } catch (NumberFormatException e) {
            throw new ValidationException("R must be a number.");
        }

        String sy = syRaw.replace(',', '.');
        try {
            y = Double.parseDouble(sy);
        } catch (NumberFormatException e) {
            throw new ValidationException("Y must be a number.");
        }

        // проверки
        validateX(x);
        validateY(y);
        validateR(r);

        return new ValidateCoordinatesRequest(x, y, r);
    }

    @Override
    public String decode(ValidateCoordinatesResponse response) {
        // если это "пустой" ответ после обновления диапазона
        if (response.x() == 0 && response.y() == 0 && response.r() == 0) {
            return String.format(
                    "{\"success\":true,\"message\":\"Диапазон X и значение R обновлены: X=[%.2f, %.2f], R=%.2f\"}",
                    RANGE_X_MIN, RANGE_X_MAX, RANGE_R
            );
        }

        final int SCALE = 3;
        String xStr = Util.formatTruncate(response.x(), SCALE);
        String yStr = Util.formatTruncate(response.y(), SCALE);
        String rStr = Util.formatTruncate(response.r(), SCALE);

        boolean hit = response.result();
        String timeStr = new SimpleDateFormat("HH:mm:ss dd.MM.yyyy").format(new Date());
        long bench = response.bench();

        return String.format(
                "{\"x\":%s,\"y\":%s,\"r\":%s,\"result\":%s,\"time\":\"%s\",\"bench\":%d}",
                xStr, yStr, rStr, hit ? "true" : "false", Util.escapeHtml(timeStr), bench
        );
    }

    @Override
    public void validate(ValidateCoordinatesRequest request) throws ValidationException {
        if (request.x() == 0 && request.y() == 0 && request.r() == 0) return; // это обновление диапазона

        validateX(request.x());
        validateY(request.y());
        validateR(request.r());
    }

    private void validateX(Double x) throws ValidationException {
        if (x < RANGE_X_MIN || x > RANGE_X_MAX) {
            throw new ValidationException("X must be in range [" + RANGE_X_MIN + ", " + RANGE_X_MAX + "]");
        }
    }

    private void validateY(Double y) throws ValidationException {
        if (y < -3 || y > 3) {
            throw new ValidationException("Y must be in range [-3, 3]");
        }
    }

    private void validateR(Double r) throws ValidationException {
        if (r != RANGE_R) {
            throw new ValidationException("R must equal " + RANGE_R);
        }
    }
}
