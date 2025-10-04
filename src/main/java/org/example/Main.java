package org.example;

import server.worker.CoordinatesValidator;

public class Main {
    public static void main(String[] args) {
        new Thread(new CoordinatesValidator()).start();
    }
}
