package server.fcgi;

import com.fastcgi.FCGIInterface;

/**
 * Обеспечивает единый экземпляр FCGIInterface.
 * В однопоточном режиме никакая синхронизация и подмена потоков не требуется.
 */
public final class FcgiInterfaceFactory {

    private static FCGIInterface fcgiInterface;

    private FcgiInterfaceFactory() {
        // утилитарный класс, без экземпляров
    }

    /**
     * Возвращает singleton-инстанс FCGIInterface.
     */
    public static synchronized FCGIInterface getInstance() {
        if (fcgiInterface == null) {
            fcgiInterface = new FCGIInterface();
        }
        return fcgiInterface;
    }
}
