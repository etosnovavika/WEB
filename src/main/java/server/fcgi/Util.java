package server.fcgi;

import com.fastcgi.FCGIInterface;
import com.fastcgi.FCGIRequest;
 import server.worker.ValidateCoordinatesResponse;

 import java.io.IOException;
 import java.math.BigDecimal;
 import java.math.RoundingMode;
 import java.net.URLDecoder;
import java.nio.ByteBuffer;
 import java.nio.charset.StandardCharsets;
 import java.text.SimpleDateFormat;
 import java.util.Date;
 import java.util.Properties;

/**
 * Утилиты: чтение параметров запроса, экранирование, форматирование чисел и JSON-помощники.
 */
public class Util {
     //возвращает properties только с нужными параметрами
        public static Properties readRequestParams() {

            System.err.println(">>> CONTENT_LENGTH=" + FCGIInterface.request.params.getProperty("CONTENT_LENGTH"));
            System.err.println(">>> CONTENT_TYPE=" + FCGIInterface.request.params.getProperty("CONTENT_TYPE"));

            try {
                if (com.fastcgi.FCGIInterface.request == null || com.fastcgi.FCGIInterface.request.params == null) {
                    return new Properties();
                }
                String method = FCGIInterface.request.params.getProperty("REQUEST_METHOD", "GET");
                String contentType = FCGIInterface.request.params.getProperty("CONTENT_TYPE", "");

                String requestUri = com.fastcgi.FCGIInterface.request.params.getProperty("REQUEST_URI", "");
                int q = requestUri.indexOf('?');
                if (q < 0) return new Properties();
                String query = requestUri.substring(q + 1);

                Properties props = new Properties();
                for (String pair : query.split("&")) {
                    if (pair.isEmpty()) continue;
                    String[] kv = pair.split("=", 2);
                    String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8.name());
                    String val = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8.name()) : "";
                    // ограничиваем длину
                    if (key.length() > 64 || val.length() > 512) continue;
                    // нет \r \n \0
                    if (val.contains("\r") || val.contains("\n") || val.indexOf('\0') >= 0) continue;
                    props.setProperty(key, val);
                }
                return props;
            } catch (Exception e) {
                System.err.println("Util.readRequestParams error: " + e.getMessage());
                return new Properties();
            }
        }
        // метод для чтения параметров из тела пост запроса
    public static Properties readPostJsonParams() {
        Properties props = new Properties();
        try {
            if (FCGIInterface.request == null) return props;

            String method = FCGIInterface.request.params.getProperty("REQUEST_METHOD", "");
            if (!"POST".equalsIgnoreCase(method)) {
                return props;
            }

            int contentLength = Integer.parseInt(
                    FCGIInterface.request.params.getProperty("CONTENT_LENGTH", "0")
            );
            if (contentLength <= 0) return props;

            byte[] bodyBytes = new byte[contentLength];
            int read = 0;
            while (read < contentLength) {
                int r = FCGIInterface.request.inStream.read(bodyBytes, read, contentLength - read);
                if (r < 0) break;
                read += r;
            }
            String body = new String(bodyBytes, 0, read, StandardCharsets.UTF_8).trim();

            // json
            body = body.replaceAll("[{}\"\\s]", "");
            for (String pair : body.split(",")) {
                String[] kv = pair.split(":", 2);
                if (kv.length != 2) continue;
                String key = kv[0];
                String val = kv[1];
                // поддержка как координат, так и диапазонов
                if (key.equals("x") || key.equals("y") || key.equals("r")
                        || key.equals("xMin") || key.equals("xMax")) {
                    props.setProperty(key, val);
                }
            }
            System.err.println(">>> raw body: " + body);
            System.err.println(">>> parsed props: " + props);
        } catch (Exception e) {
            System.err.println("Util.readPostJsonParams error: " + e.getMessage());
        }
        return props;

    }


    private static void parseUrlEncoded(String query, Properties props) throws Exception {
        for (String pair : query.split("&")) {
            if (pair.isEmpty()) continue;
            String[] kv = pair.split("=", 2);
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8.name());
            String val = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8.name()) : "";
            props.setProperty(key, val);
        }
    }


    // экранируем HTML для вставки в HTML-ответ
    public static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("\'", "&#x27;");
    }
        public static String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\': sb.append("\\\\"); break;
                case '"':  sb.append("\\\""); break;
                case '\b': sb.append("\\b");  break;
                case '\f': sb.append("\\f");  break;
                case '\n': sb.append("\\n");  break;
                case '\r': sb.append("\\r");  break;
                case '\t': sb.append("\\t");  break;
                default:
                    if (c < 0x20) {
                        // управляющие символы — юникод-экранирование
                        sb.append(String.format("\\u%04x", (int)c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }
        public static String formatTruncate(double value, int scale) {
        BigDecimal bd = new BigDecimal(Double.toString(value));
        bd = bd.setScale(scale, RoundingMode.DOWN);
        // stripTrailingZeros чтобы 2.500000 -> "2.5", а не "2.500000"
        bd = bd.stripTrailingZeros();
        return bd.toPlainString();
    }
        public static String formatTruncateFixed(double value, int scale) {
        BigDecimal bd = new BigDecimal(Double.toString(value));
        bd = bd.setScale(scale, RoundingMode.DOWN);
        // toPlainString с установленным scale вернёт нужные нули
        return bd.toPlainString();
    }


    public static String timeNow() {
        return new SimpleDateFormat("HH:mm:ss dd.MM.yyyy").format(new Date());
    }

    //собрать JSON из ValidateCoordinatesResponse

    public static String responseToJson(ValidateCoordinatesResponse r) {
        // форматирование чисел — усечение до 6 знаков
        String x = formatTruncate(r.x(), 6);
        String y = formatTruncate(r.y(), 6);
        String rr = formatTruncate(r.r(), 6);
        String result = r.result() ? "true" : "false";
        String time = timeNow();
        long bench = r.bench();

        StringBuilder sb = new StringBuilder(128);
        sb.append('{');
        sb.append("\"x\":").append(x).append(',');
        sb.append("\"y\":").append(y).append(',');
        sb.append("\"r\":").append(rr).append(',');
        sb.append("\"result\":").append(result).append(',');
        sb.append("\"time\":\"").append(escapeJson(time)).append("\",");
        sb.append("\"bench\":").append(bench);
        sb.append('}');
        return sb.toString();
    }

}


