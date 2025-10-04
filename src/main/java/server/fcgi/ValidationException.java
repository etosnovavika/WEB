package server.fcgi;

import java.util.Map;
 //кидать будем такое исклбчение
public class ValidationException extends RuntimeException {
    public ValidationException(Map<String, String> errors) {
        super(errors.toString());
    }
    public ValidationException(String message) {
        super(message);
    }
}
