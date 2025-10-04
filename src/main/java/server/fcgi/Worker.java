package server.fcgi;

import server.worker.ValidateCoordinatesResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

/**
 * Worker: main loop + ветвление ответа на HTML / JSON (по format=json)
 */
public abstract class Worker<RQ, RS> implements Runnable, FcgiConverter<RQ, RS> {
    /**
     * главный метод
     */
    @Override
    public void run() {
        try {
            while (FcgiInterfaceFactory.getInstance().FCGIaccept() >= 0) loop();
        } catch (IOException e) {
            System.err.printf("Error: %s%n", e.getMessage());
        }
    }

    /**
     * Iterates the request.
     *
     * @throws IOException If an I/O error occurs.
     */
    private void loop() throws IOException {
        // читаем параметры один раз
        final Properties params = Util.readRequestParams();
        final boolean wantJson = "json".equalsIgnoreCase(params.getProperty("format", ""));

        try {
            final RQ request = encode(params); // бросаем исключение если надо
            validate(request); // отдельная валидация
            final RS response = process(request);

            if (wantJson) {
                // пытаемся сериализовать ответ в JSON
                String json = toJson(response);
                if (json == null) {
                    // если не получилось, возвращаем ошибку сервера
                    String body = "{\"error\":\"server cannot produce json for this response\"}";
                    writeCgiResponse(500, "Internal Server Error", "application/json; charset=UTF-8", body);
                } else {
                    writeCgiResponse(200, "OK", "application/json; charset=UTF-8", json);
                }
            } else {
                // старый HTML-путь
                final String decoded = decode(response);
                writeCgiResponse(200, "OK", "application/json; charset=UTF-8", decoded);
            }
        } catch (ValidationException ve) {
            // в серверный лог
            System.err.println("Validation failed: " + ve.getMessage());
            if (wantJson) {
                String body = "{\"error\":\"" + Util.escapeJson(ve.getMessage()) + "\"}";
                writeCgiResponse(400, "Bad Request", "application/json; charset=UTF-8", body);
            } else {
                String body = "Validation error: " + Util.escapeHtml(ve.getMessage());
                writeCgiResponse(400, "Bad Request", "text/plain; charset=UTF-8", body);
            }
        } catch (Exception e) {
            //в stderr
            System.err.println("Internal error: " + e.toString());
            e.printStackTrace();
            if (wantJson) {
                String body = "{\"error\":\"internal server error\"}";
                writeCgiResponse(500, "Internal Server Error", "application/json; charset=UTF-8", body);
            } else {
                String body = "Internal Server Error";
                writeCgiResponse(500, "Internal Server Error", "text/plain; charset=UTF-8", body);
            }
        }
    }

    /**
     * Метод сериализации ответа в JSON.
     * По умолчанию поддерживает ValidateCoordinatesResponse (переиспользует Util.responseToJson).
     * При необходимости переопредели в подклассе, если у тебя другой тип RS.
     */
    protected String toJson(RS response) {
        // если у тебя конкретный тип ответа ValidateCoordinatesResponse — используем Util
        if (response instanceof ValidateCoordinatesResponse) {
            return Util.responseToJson((ValidateCoordinatesResponse) response);
        }
        // по умолчанию — не умеем сериализовать
        return null;
    }

    private void writeCgiResponse(int code, String statusText, String contentType, String body) {
        // \r\n для совместимости с Apache
        int len = body == null ? 0 : body.getBytes(StandardCharsets.UTF_8).length;
        System.out.printf("Status: %d %s\r\nContent-Type: %s\r\nContent-Length: %d\r\n\r\n%s",
                code, statusText, contentType, len, body == null ? "" : body);
    }

    /**
     * обрабатывает запрос
     *
     * @param request тело запроса
     * @return тело запроса
     */
    protected abstract RS process(RQ request);
}
