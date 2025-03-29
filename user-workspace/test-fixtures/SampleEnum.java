public enum SampleEnum {
    ACTIVE("Active status", 1),
    INACTIVE("Inactive status", 0),
    PENDING("Pending status", 2);

    private final String description;
    private final int code;

    SampleEnum(String description, int code) {
        this.description = description;
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public int getCode() {
        return code;
    }
}