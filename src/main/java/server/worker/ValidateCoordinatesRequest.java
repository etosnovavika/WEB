package server.worker;

public record ValidateCoordinatesRequest(
        Double x,
        Double y,
        Double r) {
}
