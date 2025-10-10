package server.fcgi;

import com.fastcgi.FCGIInterface;

/**
 * Обеспечивает единый экземпляр FCGIInterface.
 */
public final class FcgiInterfaceFactory {

    private static FCGIInterface fcgiInterface;

    private FcgiInterfaceFactory() {

    }

    public static synchronized FCGIInterface getInstance() {
        if (fcgiInterface == null) {
            fcgiInterface = new FCGIInterface();
        }
        return fcgiInterface;
    }
}
