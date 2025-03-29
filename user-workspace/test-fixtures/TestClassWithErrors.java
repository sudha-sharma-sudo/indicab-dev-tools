import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TestClassWithErrors {
    // Field with bad naming convention
    private String BadlyNamedField;
    
    // Method missing @Override
    public String toString() {
        return "TestClass";
    }
    
    // Service method missing @Transactional
    public List<String> getItems() {
        return List.of("item1", "item2");
    }
    
    // Too many dependencies
    @Autowired private Dependency1 dep1;
    @Autowired private Dependency2 dep2;
    @Autowired private Dependency3 dep3;
    @Autowired private Dependency4 dep4;
    @Autowired private Dependency5 dep5;
    @Autowired private Dependency6 dep6;
}