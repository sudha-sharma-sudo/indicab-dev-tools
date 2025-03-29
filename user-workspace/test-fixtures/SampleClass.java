public class SampleClass {
    private String field1;
    public int field2;
    
    public SampleClass() {
        field1 = "default";
        field2 = 0;
    }
    
    public void method1(String param) {
        System.out.println(param);
    }
    
    private int method2() { 
        return field2 * 2; 
    }
    
    public String getField1() {
        return field1;
    }
    
    // Sample nested class for testing
    public static class NestedClass {
        private int nestedField;
        
        public NestedClass(int value) {
            nestedField = value;
        }
        
        public int getValue() {
            return nestedField;
        }
    }
}
