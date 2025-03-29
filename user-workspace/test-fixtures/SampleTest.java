import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import static org.junit.jupiter.api.Assertions.*;

public class SampleTest {
    @Test
    public void testAddition() {
        assertEquals(4, 2 + 2);
    }

    @Test
    @Disabled
    public void skippedTest() {
        fail("This test should be skipped");
    }

    @BeforeEach
    public void setup() {
        // Test setup code
    }

    @Test
    public void testWithException() {
        assertThrows(IllegalArgumentException.class, () -> {
            throw new IllegalArgumentException("Test exception");
        });
    }
}