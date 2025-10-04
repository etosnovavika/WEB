//package server.fcgi;
//
//import com.fastcgi.FCGIInterface;
//
// гарантируем использование одного фсги интерфейса
//
//public final class FcgiInterfaceFactory {
//    private static FCGIInterface fcgiInterface = new FCGIInterface();
//    private static final Object ACCEPT_LOCK = new Object();
//
//    private FcgiInterfaceFactory() {}
//
//    public static FCGIInterface getInstance() {
//        return fcgiInterface == null ? fcgiInterface = new FCGIInterface() : fcgiInterface;
//    }
//
//    static Object acceptLock() {
//        return ACCEPT_LOCK;
//    }
//}

package server.fcgi;

 import com.fastcgi.FCGIInterface;

import java.io.InputStream;
import java.io.PrintStream;
import java.util.Properties;

// гарантируем использование одного фсги интерфейса

public final class FcgiInterfaceFactory {
    private static FCGIInterface fcgiInterface = new FCGIInterface();
    private static final Object ACCEPT_LOCK = new Object();
    private static final InputStream ORIGINAL_IN = System.in;
    private static final PrintStream ORIGINAL_OUT = System.out;
    private static final PrintStream ORIGINAL_ERR = System.err;
    private static final PrintStream ORIGINAL_OUT_WRAPPER = new UncloseablePrintStream(ORIGINAL_OUT);
    private static final PrintStream ORIGINAL_ERR_WRAPPER = new UncloseablePrintStream(ORIGINAL_ERR);
    private static final Properties ORIGINAL_PROPERTIES = System.getProperties();

    private FcgiInterfaceFactory() {}


    public static FCGIInterface getInstance() {
        return fcgiInterface == null ? fcgiInterface = new FCGIInterface() : fcgiInterface;
    }

    static Object acceptLock() {
        return ACCEPT_LOCK;
    }

    static void restoreSystemStreams() {
        System.setIn(ORIGINAL_IN);
        System.setOut(ORIGINAL_OUT_WRAPPER);
        System.setErr(ORIGINAL_ERR_WRAPPER);
        System.setProperties(ORIGINAL_PROPERTIES);
    }

    private static final class UncloseablePrintStream extends PrintStream {
        private UncloseablePrintStream(PrintStream delegate) {
            super(delegate, true);
        }

        @Override
        public void close() {
            flush();
        }
    }
}
