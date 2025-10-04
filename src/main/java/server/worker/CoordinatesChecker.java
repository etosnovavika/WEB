package server.worker;

import server.worker.ValidateCoordinatesRequest;

import static java.lang.Math.pow;

public class CoordinatesChecker {
    public static boolean checkCoordinates(ValidateCoordinatesRequest request) {
        return checkCoordinates(request.x(), request.y(), request.r());
    }
    private static boolean checkCoordinates(double x, double y, double r) {
        return (x>=0 && x<=r && y<=0 && y>=-r || x<=0 && y<=0 && y>= -x-r/2) ||
                x<=0 && y>= 0 && x*x +y*y <=pow(r/2, 2);
    }
}
