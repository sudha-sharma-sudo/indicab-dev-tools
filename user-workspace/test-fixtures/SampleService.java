import org.springframework.stereotype.Service;

@Service
public class SampleService {
    private final UserRepository userRepository;

    public SampleService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public void updateUser(Long id, User user) {
        User existing = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        existing.updateFrom(user);
        userRepository.save(existing);
    }
}