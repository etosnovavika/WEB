package server.fcgi;

import com.fastcgi.FCGIInterface;
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
    // возвращает properties только с нужными параметрами
    public static Properties readRequestParams() {
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

    // экранируем HTML для вставки в HTML-ответ
    public static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("\'", "&#x27;");
    }

    // экранирование строки для JSON-строки (не очень сложный, но рабочий)
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

    // убираем округление вверх и лишние нули
    public static String formatTruncate(double value, int scale) {
        BigDecimal bd = new BigDecimal(Double.toString(value));
        bd = bd.setScale(scale, RoundingMode.DOWN);
        // stripTrailingZeros чтобы 2.500000 -> "2.5", а не "2.500000"
        bd = bd.stripTrailingZeros();
        return bd.toPlainString();
    }

    // если нужен фиксированный формат с всегда scale знаков после запятой
    public static String formatTruncateFixed(double value, int scale) {
        BigDecimal bd = new BigDecimal(Double.toString(value));
        bd = bd.setScale(scale, RoundingMode.DOWN);
        // toPlainString с установленным scale вернёт нужные нули
        return bd.toPlainString();
    }

    // время сейчас в формате используемом ранее
    public static String timeNow() {
        return new SimpleDateFormat("HH:mm:ss dd.MM.yyyy").format(new Date());
    }

    // Вспомогательный метод: собрать JSON из ValidateCoordinatesResponse
    // Требует, чтобы ValidateCoordinatesResponse имел методы x(), y(), r(), result(), bench()
    // Если у тебя другие имена — подправь.
    public static String responseToJson(ValidateCoordinatesResponse r) {
        // форматирование чисел — усечение до 6 знаков для примера (подчистка длинных дробей)
        String x = formatTruncate(r.x(), 6);
        String y = formatTruncate(r.y(), 6);
        String rr = formatTruncate(r.r(), 6);
        String result = r.result() ? "true" : "false";
        String time = timeNow(); // если в r есть время — можно использовать его
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
