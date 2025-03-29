public interface SampleInterface {
    void doSomething();
    String getName();
    default String getDescription() {
        return "Default implementation";
    }
}