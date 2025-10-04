package server.worker;

public class ValidateRangeResponse {
    private final double xMin;
    private final double xMax;
    private final double r;

    public ValidateRangeResponse(double xMin, double xMax, double r) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.r = r;
    }

    public double xMin() { return xMin; }
    public double xMax() { return xMax; }
    public double r() { return r; }
}
