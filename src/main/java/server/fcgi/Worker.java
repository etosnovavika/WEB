package server.fcgi;

import com.fastcgi.FCGIInterface;
import server.worker.ValidateCoordinatesResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

/**
 * Базовый класс для FastCGI-воркеров.
 * Поддерживает GET и POST запросы.
 * Работает в однопоточном режиме.
 */
public abstract class Worker<RQ, RS> implements Runnable, FcgiConverter<RQ, RS> {

    @Override
    public void run() {
        try {
            while (FcgiInterfaceFactory.getInstance().FCGIaccept() >= 0) {
                handleRequest();
            }
        } catch (IOException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    /**
     * Обрабатывает один запрос (GET или POST).
     */
    private void handleRequest() throws IOException {
        System.err.println("=== handleRequest() start ===");

        if (FCGIInterface.request == null) {
            System.err.println("FCGI request is null");
            return;
        }
        String pathInfo = FCGIInterface.request.params.getProperty("PATH_INFO", "");
        if (pathInfo != null && !pathInfo.isEmpty()) {
            sendError(400, "Invalid path");
            return;
        }
//        System.out.println("REQUEST_METHOD=" + FCGIInterface.request.params.getProperty("REQUEST_METHOD"));
//        System.out.println("CONTENT_TYPE=" + FCGIInterface.request.params.getProperty("CONTENT_TYPE"));
//        System.out.println("CONTENT_LENGTH=" + FCGIInterface.request.params.getProperty("CONTENT_LENGTH"));


//        if (FCGIInterface.request == null) {
//            System.err.println("FCGI request is null — skipping iteration");
//            return;
//        }

        String method = FCGIInterface.request.params.getProperty("REQUEST_METHOD", "GET");
        String contentType = FCGIInterface.request.params.getProperty("CONTENT_TYPE", "");

        System.err.printf("=== New Request ===%nMethod: %s | Content-Type: %s%n", method, contentType);


        Properties params;


        // Выбираем, откуда читать параметры
        if ("POST".equalsIgnoreCase(method)) {
            params = Util.readPostJsonParams();
            params.setProperty("REQUEST_METHOD", "POST");
        } else {
            params = Util.readRequestParams();
            params.setProperty("REQUEST_METHOD", "GET");
        }
        params.setProperty("CONTENT_TYPE", contentType);

        System.err.println("Parsed params: " + params);

        System.err.println("=== handleRequest() start ===");
        System.err.printf("=== New Request ===%nMethod: %s%n", method);
        System.err.println("Parsed params: " + params);

        boolean wantJson = "json".equalsIgnoreCase(params.getProperty("format", ""));

        try {
            // Шаг 1: конвертация параметров в объект запроса
            final RQ request = encode(params);

            // Шаг 2: валидация данных
            validate(request);

            // Шаг 3: обработка бизнес-логики
            final RS response = process(request);


            // Шаг 4: сериализация результата
            String json = toJson(response);
            if (json == null) {
                json = decode(response);
            }

            // Шаг 5: отправка ответа
            if (json == null || json.isBlank()) {
                String body = "{\"error\":\"server cannot produce json for this response\"}";
                writeCgiResponse(500, "Internal Server Error", "application/json; charset=UTF-8", body);
            } else {
                writeCgiResponse(200, "OK", "application/json; charset=UTF-8", json);
            }

        } catch (ValidationException ve) {
            System.err.println("Validation failed: " + ve.getMessage());
            String body = "{\"error\":\"" + Util.escapeJson(ve.getMessage()) + "\"}";
            writeCgiResponse(400, "Bad Request", "application/json; charset=UTF-8", body);

        } catch (Exception e) {
            System.err.println("Internal error: " + e);
            e.printStackTrace();
            String body = "{\"error\":\"internal server error\"}";
            writeCgiResponse(500, "Internal Server Error", "application/json; charset=UTF-8", body);
        }

        System.err.println("=== Request handled ===\n");
    }

    /**
     * Сериализация ответа в JSON.
     * По умолчанию поддерживает ValidateCoordinatesResponse.
     */
    protected String toJson(RS response) {
        if (response instanceof ValidateCoordinatesResponse) {
            return Util.responseToJson((ValidateCoordinatesResponse) response);
        }
        return null;
    }

    /**
     * Отправка CGI-ответа клиенту.
     */
    private void writeCgiResponse(int code, String statusText, String contentType, String body) {
        int len = body == null ? 0 : body.getBytes(StandardCharsets.UTF_8).length;
        System.out.printf(
                "Status: %d %s\r\nContent-Type: %s\r\nContent-Length: %d\r\n\r\n%s",
                code, statusText, contentType, len, body == null ? "" : body
        );
    }
    private static void sendError(int code, String message) {
        System.out.println("Status: " + code + " Bad Request");
        System.out.println("Content-Type: application/json; charset=UTF-8");
        System.out.println();
        System.out.println("{\"error\":\"" + message + "\"}");
    }
    /**
     * Логика обработки запроса.
     *
     * @param request тело запроса
     * @return тело ответа
     */


    protected abstract RS process(RQ request);
}

