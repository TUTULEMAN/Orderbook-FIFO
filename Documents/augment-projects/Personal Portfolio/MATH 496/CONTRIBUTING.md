# Contributing to Enhanced Billiard Simulation

Thank you for your interest in contributing to the Enhanced Billiard Simulation project! This document provides guidelines for contributing to the MATH 496 collaborative project.

## 🎯 Project Goals

This project aims to create a comprehensive billiard simulation tool for studying:
- Periodic orbits in billiard systems
- Symmetry properties of trajectories
- Mathematical characteristics of different table geometries
- Educational visualization of physics and mathematics concepts

## 🤝 How to Contribute

### Getting Started

1. **Fork the Repository**: Create your own copy of the project
2. **Clone Locally**: Download the code to your development environment
3. **Create a Branch**: Make a new branch for your feature or fix
4. **Make Changes**: Implement your improvements
5. **Test Thoroughly**: Verify your changes work correctly
6. **Submit Pull Request**: Share your changes for review

### Areas for Contribution

#### High Priority Features
- **Symmetry Detection System**: Fix and enhance trajectory symmetry recognition
- **Three-Sided Billiard Table**: Implement triangular table geometry
- **Enhanced Periodic Detection**: Improve robustness and accuracy
- **Bug Fixes**: Address any issues found during testing

#### Medium Priority Features
- **Free-Form Table Shapes**: Custom drawable billiard tables
- **Advanced Statistics**: Enhanced trajectory analysis tools
- **Export Functionality**: Save trajectory data and configurations
- **Performance Optimization**: Improve rendering and calculation speed

#### Documentation & Testing
- **User Documentation**: Improve guides and examples
- **Code Documentation**: Add comments and technical explanations
- **Test Cases**: Create comprehensive testing scenarios
- **Example Configurations**: Develop interesting preset scenarios

## 📋 Development Guidelines

### Code Style

#### JavaScript
```javascript
// Use descriptive variable names
const trajectoryPoints = [];
const collisionTolerance = 1e-6;

// Use consistent indentation (4 spaces)
function calculateTrajectory(startX, startY, velocityX, velocityY) {
    // Function body with proper indentation
    if (condition) {
        // Nested code
    }
}

// Add comments for complex logic
// Calculate intersection point using parametric line equations
const intersectionX = startX + t * velocityX;
```

#### HTML/CSS
```html
<!-- Use semantic HTML structure -->
<section class="control-panel">
    <div class="parameter-group">
        <label for="width-slider">Table Width:</label>
        <input type="range" id="width-slider" class="parameter-slider">
    </div>
</section>
```

```css
/* Use consistent naming conventions */
.control-panel {
    display: grid;
    gap: 1rem;
}

.parameter-group {
    display: flex;
    align-items: center;
}
```

### Testing Requirements

#### Before Submitting Changes
1. **Basic Functionality**: Verify core features work
   - Ball positioning and movement
   - Trajectory calculation
   - Collision detection
   - User interface responsiveness

2. **Cross-Browser Testing**: Test in multiple browsers
   - Chrome, Firefox, Safari, Edge
   - Check for JavaScript compatibility issues
   - Verify Canvas rendering works correctly

3. **Mathematical Accuracy**: Validate physics calculations
   - Energy conservation
   - Angle of incidence = angle of reflection
   - Trajectory continuity

4. **Edge Cases**: Test boundary conditions
   - Ball at table corners
   - Very small or large table dimensions
   - Extreme precision settings
   - Maximum bounce limits

#### Test Scenarios
```javascript
// Example test cases to verify
const testCases = [
    {
        description: "Center horizontal shot should be periodic",
        setup: {x: 300, y: 200, angle: 0, table: {width: 600, height: 400}},
        expected: "Period-2 orbit detected"
    },
    {
        description: "45-degree diagonal in square should be periodic",
        setup: {x: 250, y: 250, angle: 45, table: {width: 500, height: 500}},
        expected: "Period-4 orbit detected"
    }
    // Add more test cases...
];
```

### Documentation Standards

#### Code Comments
```javascript
/**
 * Calculates the next collision point for the ball trajectory
 * @param {number} x - Current X position
 * @param {number} y - Current Y position  
 * @param {number} vx - X velocity component
 * @param {number} vy - Y velocity component
 * @returns {Object} Collision info: {x, y, wall, time}
 */
function findNextCollision(x, y, vx, vy) {
    // Implementation details...
}
```

#### Commit Messages
```
feat: Add triangular billiard table support
fix: Correct periodic orbit detection for edge cases
docs: Update user guide with new features
test: Add validation for collision detection accuracy
refactor: Modularize physics engine components
```

## 🔧 Technical Considerations

### Performance Guidelines

#### Optimization Priorities
1. **Calculation Efficiency**: Minimize redundant computations
2. **Memory Management**: Limit trajectory point storage
3. **Rendering Performance**: Optimize canvas drawing operations
4. **User Responsiveness**: Maintain smooth interaction

#### Code Efficiency
```javascript
// Good: Cache frequently used values
const tableWidth = tableSettings.width;
const tableHeight = tableSettings.height;

// Good: Use efficient algorithms
const collision = findNearestCollision(walls);

// Avoid: Repeated expensive calculations
// Bad: Math.sqrt(dx*dx + dy*dy) called multiple times
// Good: Calculate once and store result
```

### Browser Compatibility

#### Supported Features
- HTML5 Canvas API
- ES6 JavaScript features
- CSS Grid and Flexbox
- Modern event handling

#### Fallback Considerations
- Graceful degradation for older browsers
- Feature detection before using advanced APIs
- Clear error messages for unsupported features

## 🐛 Bug Reports

### Information to Include
1. **Browser and Version**: Chrome 91, Firefox 89, etc.
2. **Operating System**: Windows 10, macOS 11, Ubuntu 20.04
3. **Steps to Reproduce**: Detailed sequence of actions
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshots**: If visual issues are involved
7. **Console Errors**: Any JavaScript errors in browser console

### Bug Report Template
```markdown
**Browser**: Chrome 91.0.4472.124
**OS**: Windows 10
**Steps to Reproduce**:
1. Set table to 600x400 pixels
2. Place ball at center (300, 200)
3. Shoot at 0 degrees
4. Observe trajectory

**Expected**: Period-2 orbit detected
**Actual**: "No periodic orbit found" message
**Console Errors**: None
**Additional Notes**: Issue occurs consistently with horizontal shots
```

## 📝 Pull Request Process

### Before Submitting
1. **Test Your Changes**: Verify functionality works correctly
2. **Update Documentation**: Modify README or guides if needed
3. **Check Code Style**: Follow project conventions
4. **Write Clear Description**: Explain what changes were made and why

### Pull Request Template
```markdown
## Description
Brief description of changes made

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tested in multiple browsers
- [ ] Verified mathematical accuracy
- [ ] Checked edge cases
- [ ] Updated documentation

## Screenshots (if applicable)
Include screenshots for visual changes

## Additional Notes
Any additional context or considerations
```

### Review Process
1. **Automated Checks**: Code style and basic functionality
2. **Peer Review**: Team member reviews changes
3. **Testing**: Reviewer tests the changes
4. **Feedback**: Discussion and requested changes
5. **Approval**: Changes approved and merged

## 🎓 Learning Resources

### Mathematical Background
- **Billiard Ball Physics**: Classical mechanics and collision theory
- **Periodic Orbits**: Dynamical systems theory
- **Computational Geometry**: Intersection algorithms and coordinate systems

### Technical Skills
- **HTML5 Canvas**: Graphics programming and animation
- **JavaScript**: Modern ES6+ features and best practices
- **Mathematical Computing**: Numerical methods and precision handling

### Useful References
- MDN Web Docs for JavaScript and Canvas API
- Mathematical billiards research papers
- Physics simulation tutorials and examples

## 📞 Communication

### Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Design decisions and questions
- **Pull Request Comments**: Code-specific discussions
- **Project Wiki**: Shared knowledge and documentation

### Response Times
- **Bug Reports**: Acknowledged within 2-3 days
- **Pull Requests**: Initial review within 1 week
- **Questions**: Response within 1-2 days

## 🏆 Recognition

Contributors will be acknowledged in:
- Project README file
- Release notes for significant contributions
- Academic presentations or papers (if applicable)

Thank you for contributing to the Enhanced Billiard Simulation project! Your contributions help advance mathematical education and research tools.
