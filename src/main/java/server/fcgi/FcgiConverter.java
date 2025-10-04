package server.fcgi;

import java.util.Properties;
// описываем тип всех конвертеров

public interface FcgiConverter <Request, Response> {
    Request encode(Properties params);
    String decode(Response response);
    void validate(Request request) throws ValidationException;
}
