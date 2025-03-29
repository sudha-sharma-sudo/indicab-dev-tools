public record SampleRecord(String name, int age, List<String> items) {
    public String getNameUppercase() {
        return name.toUpperCase();
    }
    
    public int getAgePlusYears(int years) {
        return age + years;
    }
}