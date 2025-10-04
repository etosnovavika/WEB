package server.fcgi;

import com.fastcgi.FCGIInterface;

// гарантируем использование одного фсги интерфейса

public final class FcgiInterfaceFactory {
    private static FCGIInterface fcgiInterface = new FCGIInterface();

    private FcgiInterfaceFactory() {}

    public static FCGIInterface getInstance() {return fcgiInterface == null ? fcgiInterface = new FCGIInterface() : fcgiInterface;}
}