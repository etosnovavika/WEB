package server.worker;

public record ValidateCoordinatesResponse(
        Double x,
        Double y,
        Double r,
        boolean result,
        long bench
) {
}
