package server.worker;

import server.fcgi.Util;
import server.fcgi.ValidationException;
import server.fcgi.Worker;

import java.util.Properties;

public final class RangeValidator extends Worker<ValidateRangeRequest, ValidateRangeResponse> {

    @Override
    protected ValidateRangeResponse process(ValidateRangeRequest request) {
        return new ValidateRangeResponse(
                request.xMin(),
                request.xMax(),
                request.r(),
                "Диапазон успешно установлен"
        );
    }

    @Override
    public ValidateRangeRequest encode(Properties params) throws ValidationException {
        String sxMin = params.getProperty("xMin");
        String sxMax = params.getProperty("xMax");
        String sr = params.getProperty("r");

        if (sxMin == null || sxMax == null || sr == null)
            throw new ValidationException("Missing parameters: xMin, xMax, and r are required.");

        double xMin, xMax, r;
        try {
            xMin = Double.parseDouble(sxMin);
            xMax = Double.parseDouble(sxMax);
            r = Double.parseDouble(sr);
        } catch (NumberFormatException e) {
            throw new ValidationException("Invalid number format.");
        }

        return new ValidateRangeRequest(xMin, xMax, r);
    }


    @Override
    public String decode(ValidateRangeResponse response) {
        return String.format(
                "{\"xMin\":%s,\"xMax\":%s,\"r\":%s,\"message\":\"%s\"}",
                Util.formatTruncate(response.xMin(), 3),
                Util.formatTruncate(response.xMax(), 3),
                Util.formatTruncate(response.r(), 3),
                Util.escapeJson(response.message())
        );
    }

    @Override
    public void validate(ValidateRangeRequest request) throws ValidationException {
        if (request.xMin() >= request.xMax()) {
            throw new ValidationException("xMin must be < xMax.");
        }
        if (request.r() <= 0) {
            throw new ValidationException("R must be > 0.");
        }
    }
}
