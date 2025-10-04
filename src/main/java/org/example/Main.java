package org.example;

import server.worker.CoordinatesValidator;
import server.worker.RangeValidator;

public class Main {
    public static void main(String[] args) {
//        new Thread(new CoordinatesValidator()).start();
//        new Thread(new RangeValidator()).start();
        new Thread(new CoordinatesValidator(), "fcgi-worker-1").start();
        new Thread(new CoordinatesValidator(), "fcgi-worker-2").start();
    }
}
