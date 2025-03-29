public enum SampleEnum {
    VALUE1("First value"), 
    VALUE2("Second value");
    
    private String description;
    
    SampleEnum(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}