// ValidateRangeResponse.java
package server.worker;

public record ValidateRangeResponse(double xMin, double xMax, double r, String message) { }
