# MATH 496 - Billiard Simulation Project

## How to Run

### Requirements

- Web browser (Chrome, Firefox, Safari, or Edge)
- Python 3.7+ (for Jupyter notebooks)
- Jupyter Notebook or JupyterLab

### Installation

1. Install Python dependencies:
```bash
pip install jupyter numpy matplotlib scikit-image
```

2. Start Jupyter notebook server:
```bash
jupyter notebook
```

### Running the Simulations

#### Simulations
Open any of the HTML files directly in your web browser (there are pros and cons to both):
- `Enhanced_Billard_Sim.html` - Visual Simulation (Poor Math abilities)
- `Logic Playground.ipynb` - Simulation with periodic orbit detection + Symmetry Analysis (Good Math abilities)

## Project Components

## Usage

### Basic Operation
1. Open HTML file in web browser
2. Click anywhere on table to position ball
3. Drag from ball to set direction and shoot
4. Use controls panel to adjust settings
5. Hover over bounce points to see angle information

### Jupyter Analysis
1. Open Logic Playground notebook
2. Modify parameters in parameter cells
3. Run simulation cells to generate trajectories
4. Analyze results using provided visualization functions

## How to Contribute

We welcome contributions to improve the billiard simulation project. The development workflow follows a notebook-first approach where mathematical algorithms are prototyped in Jupyter before being implemented in JavaScript.

### Quick Overview
1. Fork the repository and create a feature branch
2. Develop and test new algorithms in Logic Playground notebook
3. Translate working algorithms to JavaScript in HTML files
4. Test thoroughly in web browser environment
5. Submit pull request with clear description of changes

For detailed contribution guidelines, coding standards, and development setup instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).
