# Death Star Quantum Control System
### Interactive Neutral-Atom Quantum Computing Demonstration

An interactive, dependency-free web demonstration designed as a theatrical, scientifically responsible "post-credits scene" for an academic presentation on **neutral-atom quantum computing**.

---

## 1. Overview & Conceptual Pipeline

The demonstration visually walks through the real computational sequence of a neutral-atom quantum computer using a playful Star Wars visual metaphor:

$$\text{PROGRAM} \longrightarrow \text{GEOMETRY} \longrightarrow \text{LASER CONTROL} \longrightarrow \text{RYDBERG EXCITATION} \longrightarrow \text{BLOCKADE} \longrightarrow \text{QUANTUM EVOLUTION} \longrightarrow \text{READOUT} \longrightarrow \text{CLASSICAL RESULT}$$

### Key Concept:
> *“Nature manufactures the qubit. We engineer the control.”*

Individual alkali atoms ($^{87}\text{Rb}$) are physically trapped in space using focused laser beams (**optical tweezers**). By specifying physical coordinates, the programmer designs the computational graph. Laser pulses excite atoms into high-energy **Rydberg states**, creating strong long-range interactions ($V(R) \propto 1/R^6$) that suppress adjacent excitations (**Rydberg blockade**). At the end of the calculation, resonant light drives optical transitions, and a scientific camera collects emitted fluorescence photons to read out the classical bitstring.

---

## 2. Star Wars Metaphor vs. Real Quantum Physics

| Star Wars Visual Metaphor | Real Quantum Physical System | Scientific Reality & Nuance |
| :--- | :--- | :--- |
| **Death Star Command Interior** | Ultra-High Vacuum (UHV) Chamber & Optical Table | The Death Star is the fictional setting; it is **not** literally a quantum computer. The UHV chamber maintains pressure $< 10^{-11}\text{ mbar}$ to isolate atoms. |
| **Stormtroopers ($q_0 \dots q_{12}$)** | Neutral Alkali Atoms ($^{87}\text{Rb}$) | Identical physical atoms trapped at designated coordinates. Not individual sentient agents. |
| **Lightsaber Beams** | Optical Tweezers ($\lambda \approx 850\text{ nm}$) | Focused laser beams produce tight AC Stark optical dipole potentials. The lightsaber style is a playful visual metaphor for focused laser beams, not literal beam weapons. |
| **Rydberg Excitation (Violet Aura)** | High Principal Quantum Number $\|r\rangle = \|70S_{1/2}\rangle$ | Valence electron orbital balloons by $n^2$ to thousands of Bohr radii, imparting enormous electric dipole polarizability. |
| **Rydberg Blockade (Shield & Radius)** | Van der Waals Dipole-Dipole Energy Shift | $V(R) = C_6 / R^6$. If two atoms are closer than $R_b$, the state $\|rr\rangle$ is shifted far out of resonance with laser drive $\Omega$. Nearest neighbor is blocked; far neighbor is unblocked. |
| **Resonance Fluorescence Camera** | EMCCD / sCMOS Optical Readout ($\lambda \approx 780\text{ nm}$) | Atoms are illuminated with resonant light. Trapped ground atoms scatter photons (**bright**). Rydberg atoms were unconfined and evaporated (**dark**). |
| **Luke's Escape Route** | Maximum Independent Set (MIS) Solution | Native optimization problem of Rydberg arrays. The "escape route" is our narrative layer mapped onto the dark MIS sites. |

---

## 3. Optical Readout: Resonance Fluorescence Imaging

A critical teaching point in neutral-atom quantum computing is that **qubits have no diagnostic wires attached to them**. 

Readout is performed optically:
1. **Rydberg State Loss**: Before imaging, atoms left in the Rydberg state $|r\rangle$ are not trapped by the ground-state tweezer potential and are anti-trapped or expelled from the register.
2. **Resonant Illumination**: A cycling optical transition ($\lambda \approx 780\text{ nm}$) is driven across the register.
3. **Fluorescence Detection**:
   - Atoms that collapsed into the ground state $|g\rangle$ remain trapped and scatter thousands of photons per millisecond $\longrightarrow$ **BRIGHT SPOT (bit 0)**.
   - Atoms that collapsed into the Rydberg state $|r\rangle$ have evaporated $\longrightarrow$ **DARK SPOT (bit 1)**.
4. **The Camera Payoff**: The camera does **not** take a normal photograph of a quantum wavefunction. It collects optical fluorescence onto a scientific sensor to determine which trap sites are occupied vs. vacant. The resulting image yields classical bits.
5. **The Joke**: The dark sites (vacant guard posts) form a path from the detention block to the exit dock. Luke now has the "picture" he needs to navigate his escape route!

---

## 4. Scientific Integrity & Hamiltonian Disclosure

The demo runs an **exact, idealized state-vector emulator** written in pure JavaScript, solving the Rydberg Hamiltonian with second-order Strang splitting:

$$\frac{H(t)}{\hbar} = \sum_{i} \frac{\Omega(t)}{2} \sigma_x^{(i)} - \sum_{i} \Delta(t) n_i + \sum_{i < j} \frac{C_6}{|\mathbf{r}_i - \mathbf{r}_j|^6} n_i n_j$$

* **Interaction coefficient**: $C_6 = 5.42 \times 10^6\text{ rad}\cdot\mu\text{m}^6/\mu\text{s}$ ($^{87}\text{Rb}$ $n=70$).
* **Rabi frequency**: $\Omega/2\pi = 1.5\text{ MHz}$.
* **Blockade radius**: $R_b = (C_6 / \Omega)^{1/6} \approx 9.12\,\mu\text{m}$.
* **Corridor spacing**: Nearest neighbors $R = 6.0\,\mu\text{m} < R_b$ (strongly blockaded, $V/2\pi \approx 18.5\text{ MHz}$). Diagonal / next waypoints $R \ge 12.0\,\mu\text{m} > R_b$ (unblocked, $V/2\pi \approx 0.29\text{ MHz}$, exactly $1/64$ of nearest-neighbor strength).
* **NO Quantum Advantage Claimed**: The browser verifies all $2^{13} = 8,192$ states classically in $\sim 2\text{ ms}$. This demo is an educational walkthrough of the architecture, not a demonstration of quantum supremacy.

---

## 5. Portability & Running Locally

This project has **zero external dependencies**, requires **no build step**, and makes **no remote network calls**.

### Option A: Double-Click (Zero Install)
You can open `index.html` directly from a USB stick or file manager in any modern browser (Chrome, Edge, Firefox, Safari). Classic scripts and relative paths ensure complete `file://` compatibility without CORS errors.

### Option B: Local HTTP Server
```bash
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

---

## 6. Hosting on GitHub Pages

1. Push this repository to GitHub.
2. In your GitHub repository, navigate to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment** $\rightarrow$ **Source**, select **Deploy from a branch**.
4. Set branch to `main` (or your default branch) and folder to `/ (root)`.
5. Click **Save**. Within 1–2 minutes, your demo will be live at `https://<username>.github.io/<repo-name>/`.
6. The included `.nojekyll` file ensures GitHub Pages serves all assets and subdirectories directly without Jekyll processing.

---

## 7. Presenter Controls & Keyboard Shortcuts

Designed for seamless operation with presentation clickers and projectors:

| Key | Action |
| :--- | :--- |
| **Space** / **Enter** | Start demonstration / Advance to next phase |
| **P** | Pause / Resume animation timeline |
| **R** | Reset demo to initial state |
| **M** | Toggle sound effects (muted by default for talks) |
| **S** / **E** | Toggle Scientific Reference Dossier & Live Coordinate Editor |
| **F** | Toggle Fullscreen mode |
| **Esc** | Close Scientific Dossier modal |

---

## 8. Verification & Test Suite

The test suite runs entirely offline in the browser at `tests/index.html`:
- 19 automated unit & physics tests verifying:
  - Register parser and validation limits.
  - $V(2R) = V(R)/64$ inverse-sixth power scaling.
  - Blockade radius calculation ($R_b \approx 9.12\,\mu\text{m}$).
  - Classical MIS solver uniqueness on the 13-atom corridor.
  - Exact state-vector emulator norm conservation ($\sum P_i = 1.000000000001$).
  - Emulator agreement with classical MIS ($P(\text{MIS}) \approx 73.2\%$).
  - Two-atom blockade suppression ($P(rr) < 0.002$ at $6\,\mu\text{m}$ vs $P(rr) > 0.97$ at $12\,\mu\text{m}$).
  - Deterministic seeded sampling for 100% presentation reliability.
