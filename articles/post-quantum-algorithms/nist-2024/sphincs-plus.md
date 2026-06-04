# SPHINCS+: A Deep Dive into the Mathematics Behind the Post-Quantum Signature Scheme

## Table of Contents

1. [Introduction](#introduction)
2. [Motivation and Security Context](#motivation-and-security-context)
3. [Cryptographic Primitives and Building Blocks](#cryptographic-primitives-and-building-blocks)
4. [Hash Functions and Their Properties](#hash-functions-and-their-properties)
5. [One-Time Signature Schemes: WOTS+](#one-time-signature-schemes-wots)
6. [Few-Time Signature Schemes: FORS](#few-time-signature-schemes-fors)
7. [Merkle Trees and Authentication Paths](#merkle-trees-and-authentication-paths)
8. [Hypertree Structure](#hypertree-structure)
9. [The Complete SPHINCS+ Scheme](#the-complete-sphincs-scheme)
10. [Parameter Sets and Security Levels](#parameter-sets-and-security-levels)
11. [Security Proofs and Reductions](#security-proofs-and-reductions)
12. [Performance Analysis](#performance-analysis)
13. [Conclusion](#conclusion)

---

## 1. Introduction

**SPHINCS+** is a stateless hash-based digital signature scheme, selected by NIST in 2022 as part of its Post-Quantum Cryptography (PQC) standardization process. It is now standardized under **FIPS 205**. Unlike lattice-based or code-based schemes, SPHINCS+ derives its security entirely from the properties of cryptographic hash functions — making it one of the most conservative and well-understood post-quantum signature schemes available.

The "+" in SPHINCS+ denotes its evolution from the original SPHINCS scheme (2015), incorporating several improvements in security analysis, efficiency, and parameter selection.

The core philosophy of SPHINCS+ is elegant:

> *If the underlying hash function is secure, then the signature scheme is secure — even against a quantum adversary.*

This article explores, in full mathematical detail, every layer of the SPHINCS+ construction.

---

## 2. Motivation and Security Context

### 2.1 The Quantum Threat

Classical signature schemes such as **RSA** and **ECDSA** rely on the hardness of:
- Integer factorization (RSA)
- Discrete logarithm problem over elliptic curves (ECDSA)

**Shor's algorithm** (1994) solves both problems in polynomial time on a quantum computer, rendering these schemes insecure in a post-quantum world.

Hash-based signatures, by contrast, rely only on the **collision resistance**, **preimage resistance**, and **second-preimage resistance** of hash functions. Grover's algorithm provides a quadratic speedup for brute-force search, but this is mitigated by simply **doubling the output length** of the hash function.

### 2.2 Security Model

SPHINCS+ is proven secure in the **Random Oracle Model (ROM)** and also analyzed in the **Quantum Random Oracle Model (QROM)**, where the adversary can query the hash function in quantum superposition.

The security goal is **existential unforgeability under chosen-message attacks (EUF-CMA)**:

> No probabilistic polynomial-time adversary, given a public key and polynomially many message-signature pairs of their choice, can produce a valid signature on a new message with non-negligible probability.

---

## 3. Cryptographic Primitives and Building Blocks

SPHINCS+ is built from a small set of carefully defined cryptographic functions. Let $n$ be the **security parameter** (in bytes), typically $n \in \{16, 24, 32\}$ corresponding to 128, 192, and 256-bit security levels.

### 3.1 The Parameter Space

The full parameter set of SPHINCS+ is defined by the tuple:

$$\text{SPHINCS+}(n, h, d, a, k, w, \text{robust/simple})$$

Where:
- $n$ — security parameter (in bytes)
- $h$ — total height of the hypertree
- $d$ — number of layers in the hypertree
- $a$ — height of each FORS tree (so each tree has $2^a$ leaves)
- $k$ — number of FORS trees
- $w$ — Winternitz parameter for WOTS+
- **robust/simple** — variant of the hash function instantiation

### 3.2 Core Hash Functions

SPHINCS+ defines several tweakable hash functions derived from a base hash function $H$ (e.g., SHA-256, SHAKE256, Haraka):

| Function | Signature | Description |
|---|---|---|
| $\mathsf{PRF}$ | $\{0,1\}^n \times \{0,1\}^{32} \to \{0,1\}^n$ | Pseudorandom function |
| $\mathsf{PRF_{msg}}$ | $\{0,1\}^n \times \{0,1\}^n \times \mathcal{M} \to \{0,1\}^{kn+h\lceil\log_2 d\rceil}$ | Message randomization |
| $\mathsf{H_{msg}}$ | $\{0,1\}^{3n} \times \mathcal{M} \to \{0,1\}^{m}$ | Message digest |
| $\mathsf{F}$ | $\{0,1\}^n \times \{0,1\}^n \to \{0,1\}^n$ | Single-input hash |
| $\mathsf{H}$ | $\{0,1\}^n \times \{0,1\}^{2n} \to \{0,1\}^n$ | Two-input hash (for Merkle trees) |
| $\mathsf{T}_\ell$ | $\{0,1\}^n \times \{0,1\}^{\ell n} \to \{0,1\}^n$ | $\ell$-input hash |

All these functions take a **public seed** $\mathsf{PK.seed} \in \{0,1\}^n$ and an **address** $\mathsf{ADRS} \in \{0,1\}^{32}$ as implicit or explicit inputs, enabling **domain separation** across the entire scheme.

### 3.3 The Address Scheme (ADRS)

The address structure is a 32-byte value that encodes the position of a hash call within the overall tree structure. It contains:

```
[ layer address | tree address | type | keypair address | chain address | hash address ]
```

This ensures that no two hash calls in the entire scheme share the same input, preventing cross-context attacks. The **type** field distinguishes between:
- `0x00` — WOTS+ hash
- `0x01` — WOTS+ public key compression
- `0x02` — Hash tree (Merkle)
- `0x03` — FORS tree
- `0x04` — FORS tree root compression

---

## 4. Hash Functions and Their Properties

### 4.1 Required Security Properties

Let $H: \{0,1\}^* \to \{0,1\}^n$ be a hash function. SPHINCS+ requires:

**Preimage Resistance:**
$$\Pr\left[x \leftarrow \mathcal{A}(H(x')) : H(x) = H(x')\right] \leq \epsilon_{\text{pre}}$$

For a random $x' \in \{0,1\}^n$, finding any preimage is computationally infeasible. Classically, this requires $O(2^n)$ operations; quantumly, Grover's algorithm achieves $O(2^{n/2})$.

**Second-Preimage Resistance:**
$$\Pr\left[x \leftarrow \mathcal{A}(x', H(x')) : H(x) = H(x') \wedge x \neq x'\right] \leq \epsilon_{\text{2pre}}$$

**Collision Resistance:**
$$\Pr\left[(x, x') \leftarrow \mathcal{A}() : H(x) = H(x') \wedge x \neq x'\right] \leq \epsilon_{\text{col}}$$

Classically, birthday attacks find collisions in $O(2^{n/2})$; quantumly, BHT algorithm achieves $O(2^{n/3})$.

### 4.2 Pseudorandomness

SPHINCS+ also requires the hash functions to behave as **pseudorandom functions (PRFs)** when keyed. Formally, for a random key $K$:

$$\left| \Pr[\mathcal{A}^{F_K(\cdot)} = 1] - \Pr[\mathcal{A}^{R(\cdot)} = 1] \right| \leq \epsilon_{\text{prf}}$$

where $R$ is a truly random function.

### 4.3 Tweakable Hash Functions

SPHINCS+ uses **tweakable hash functions** of the form:

$$\tilde{H}: \{0,1\}^n \times \{0,1\}^{32} \times \{0,1\}^{\ell n} \to \{0,1\}^n$$

The first argument is the **public key seed** (acting as a key), the second is the **address** (acting as a tweak), and the third is the actual input. This formalism, introduced by Bernstein et al., allows a clean security reduction.

The **robust** instantiation uses:

$$\tilde{H}(\mathsf{PK.seed}, \mathsf{ADRS}, M) = H\left(\mathsf{PK.seed} \| \mathsf{ADRS} \| M \oplus \mathsf{PRF}(\mathsf{PK.seed}, \mathsf{ADRS})\right)$$

The **simple** instantiation (faster, slightly weaker security argument):

$$\tilde{H}(\mathsf{PK.seed}, \mathsf{ADRS}, M) = H\left(\mathsf{PK.seed} \| \mathsf{ADRS} \| M\right)$$

---

## 5. One-Time Signature Schemes: WOTS+

The **Winternitz One-Time Signature Plus (WOTS+)** scheme is the fundamental signing primitive in SPHINCS+. It allows signing exactly **one message** per key pair.

### 5.1 The Winternitz Parameter

The Winternitz parameter $w \in \{4, 16, 256\}$ controls the trade-off between signature size and computation. Define:

$$\ell_1 = \left\lceil \frac{8n}{\log_2 w} \right\rceil$$

$$\ell_2 = \left\lfloor \frac{\log_2(\ell_1 \cdot (w-1))}{\log_2 w} \right\rfloor + 1$$

$$\ell = \ell_1 + \ell_2$$

Here:
- $\ell_1$ is the number of $\log_2(w)$-bit chunks needed to encode an $n$-byte message digest
- $\ell_2$ is the number of chunks needed for the **checksum**
- $\ell$ is the total number of hash chains

**Example** with $n = 32$, $w = 16$:
$$\ell_1 = \left\lceil \frac{256}{4} \right\rceil = 64, \quad \ell_2 = \left\lfloor \frac{\log_2(64 \cdot 15)}{4} \right\rfloor + 1 = 3, \quad \ell = 67$$

### 5.2 Hash Chains

The core operation in WOTS+ is the **hash chain**. Define the chaining function:

$$c^i(\mathsf{PK.seed}, \mathsf{ADRS}, X) = \begin{cases} X & \text{if } i = 0 \\ \mathsf{F}(\mathsf{PK.seed}, \mathsf{ADRS}', c^{i-1}(\mathsf{PK.seed}, \mathsf{ADRS}, X)) & \text{if } i > 0 \end{cases}$$

where $\mathsf{ADRS}'$ is the address with the hash address set to $i-1$.

More explicitly, for a starting value $X \in \{0,1\}^n$ and chain index $s$, the chain of length $i$ starting at position $s$ is:

$$c^i_s(X) = \underbrace{\mathsf{F} \circ \mathsf{F} \circ \cdots \circ \mathsf{F}}_{i \text{ times}}(X)$$

with appropriately updated addresses at each step.

### 5.3 Key Generation

**Secret key:** Generate $\ell$ independent random values:

$$\mathsf{sk}_1, \mathsf{sk}_2, \ldots, \mathsf{sk}_\ell \xleftarrow{\$} \{0,1\}^n$$

In practice, these are derived deterministically:

$$\mathsf{sk}_i = \mathsf{PRF}(\mathsf{SK.seed}, \mathsf{ADRS}_i)$$

**Public key:** Apply the full chain of length $w-1$ to each secret key element:

$$\mathsf{pk}_i = c^{w-1}(\mathsf{PK.seed}, \mathsf{ADRS}_i, \mathsf{sk}_i)$$

The WOTS+ public key is then the hash of all public key elements:

$$\mathsf{pk} = \mathsf{T}_\ell(\mathsf{PK.seed}, \mathsf{ADRS}, \mathsf{pk}_1 \| \mathsf{pk}_2 \| \cdots \| \mathsf{pk}_\ell)$$

### 5.4 Message Encoding

To sign a message digest $M \in \{0,1\}^{8n}$, first convert it to base $w$:

$$M = (m_1, m_2, \ldots, m_{\ell_1}) \in \{0, 1, \ldots, w-1\}^{\ell_1}$$

Compute the **checksum**:

$$C = \sum_{i=1}^{\ell_1} (w - 1 - m_i)$$

Convert $C$ to base $w$:

$$C = (c_1, c_2, \ldots, c_{\ell_2}) \in \{0, 1, \ldots, w-1\}^{\ell_2}$$

The full message representation is:

$$\mathbf{b} = (m_1, \ldots, m_{\ell_1}, c_1, \ldots, c_{\ell_2}) \in \{0, 1, \ldots, w-1\}^\ell$$

**Why the checksum?** Without it, an adversary could forge a signature by advancing chains (applying more hash iterations). The checksum ensures that increasing any $m_i$ forces a decrease in some $c_j$, which would require inverting a hash function.

### 5.5 Signing

The signature on message $M$ is:

$$\sigma_{\text{WOTS+}} = \left(c^{b_1}(\mathsf{sk}_1), c^{b_2}(\mathsf{sk}_2), \ldots, c^{b_\ell}(\mathsf{sk}_\ell)\right)$$

Each element $\sigma_i = c^{b_i}(\mathsf{sk}_i)$ is the result of applying the hash chain $b_i$ times to the secret key element.

### 5.6 Verification

Given signature $\sigma = (\sigma_1, \ldots, \sigma_\ell)$ and message $M$:

1. Recompute $\mathbf{b} = (b_1, \ldots, b_\ell)$ from $M$
2. For each $i$, compute:
$$\mathsf{pk}'_i = c^{w-1-b_i}(\sigma_i)$$
3. Recompute the public key:
$$\mathsf{pk}' = \mathsf{T}_\ell(\mathsf{PK.seed}, \mathsf{ADRS}, \mathsf{pk}'_1 \| \cdots \| \mathsf{pk}'_\ell)$$
4. Accept if $\mathsf{pk}' = \mathsf{pk}$

**Correctness:** Since $\sigma_i = c^{b_i}(\mathsf{sk}_i)$, applying $w-1-b_i$ more iterations gives:

$$c^{w-1-b_i}(\sigma_i) = c^{w-1-b_i}(c^{b_i}(\mathsf{sk}_i)) = c^{w-1}(\mathsf{sk}_i) = \mathsf{pk}_i \checkmark$$

### 5.7 Security of WOTS+

WOTS+ is proven **existentially unforgeable** under the assumption that $\mathsf{F}$ is a **pseudorandom function family**. The security reduction shows:

$$\epsilon_{\text{WOTS+}} \leq \ell \cdot (w-1) \cdot \epsilon_{\text{PRF}}$$

The one-time nature is critical: signing two different messages with the same key leaks information about the secret key, as an adversary can observe chain positions and potentially reconstruct secret values.

---

## 6. Few-Time Signature Schemes: FORS

**FORS (Forest of Random Subsets)** is a **few-time signature scheme** that replaces the HORST scheme used in the original SPHINCS. It is designed to sign the message digest output of $\mathsf{H_{msg}}$.

### 6.1 Structure

FORS uses $k$ binary trees, each of height $a$, giving $k \cdot 2^a$ leaves in total.

**Parameters:**
- $k$ — number of trees (also the number of indices selected)
- $a$ — height of each tree
- Each tree has $2^a$ leaves

The message digest for FORS is a bit string of length $ka$ bits:

$$\text{digest} \in \{0,1\}^{ka}$$

This is split into $k$ chunks of $a$ bits each:

$$\text{digest} = (\text{idx}_1, \text{idx}_2, \ldots, \text{idx}_k), \quad \text{idx}_i \in \{0, 1, \ldots, 2^a - 1\}$$

### 6.2 Key Generation

**Secret keys:** For each tree $i \in \{1, \ldots, k\}$ and each leaf $j \in \{0, \ldots, 2^a - 1\}$:

$$\mathsf{sk}[i][j] = \mathsf{PRF}(\mathsf{SK.seed}, \mathsf{ADRS}_{i,j})$$

**Leaf computation:** Each leaf is the hash of its secret key:

$$\mathsf{leaf}[i][j] = \mathsf{F}(\mathsf{PK.seed}, \mathsf{ADRS}_{i,j}, \mathsf{sk}[i][j])$$

**Tree construction:** Each of the $k$ trees is a standard binary Merkle tree. The root of tree $i$ is:

$$\mathsf{root}_i = \text{MerkleRoot}(\mathsf{leaf}[i][0], \mathsf{leaf}[i][1], \ldots, \mathsf{leaf}[i][2^a - 1])$$

**Public key:** The FORS public key is the hash of all $k$ roots:

$$\mathsf{pk}_{\text{FORS}} = \mathsf{T}_k(\mathsf{PK.seed}, \mathsf{ADRS}, \mathsf{root}_1 \| \mathsf{root}_2 \| \cdots \| \mathsf{root}_k)$$

### 6.3 Signing

Given message indices $(\text{idx}_1, \ldots, \text{idx}_k)$:

For each $i \in \{1, \ldots, k\}$:
1. Reveal the secret key at position $\text{idx}_i$ in tree $i$:
$$\sigma_i^{\text{sk}} = \mathsf{sk}[i][\text{idx}_i]$$
2. Compute the **authentication path** — the sibling nodes along the path from leaf $\text{idx}_i$ to the root:
$$\mathsf{AUTH}_i = (\mathsf{auth}_{i,0}, \mathsf{auth}_{i,1}, \ldots, \mathsf{auth}_{i,a-1})$$

The full FORS signature is:

$$\sigma_{\text{FORS}} = \left((\sigma_1^{\text{sk}}, \mathsf{AUTH}_1), (\sigma_2^{\text{sk}}, \mathsf{AUTH}_2), \ldots, (\sigma_k^{\text{sk}}, \mathsf{AUTH}_k)\right)$$

Total size: $k \cdot (1 + a) \cdot n$ bytes.

### 6.4 Verification

For each $i \in \{1, \ldots, k\}$:
1. Recompute the leaf: $\mathsf{leaf}'_i = \mathsf{F}(\mathsf{PK.seed}, \mathsf{ADRS}, \sigma_i^{\text{sk}})$
2. Use $\mathsf{AUTH}_i$ to recompute the root $\mathsf{root}'_i$ via the Merkle path
3. Recompute: $\mathsf{pk}'_{\text{FORS}} = \mathsf{T}_k(\mathsf{PK.seed}, \mathsf{ADRS}, \mathsf{root}'_1 \| \cdots \| \mathsf{root}'_k)$
4. Accept if $\mathsf{pk}'_{\text{FORS}} = \mathsf{pk}_{\text{FORS}}$

### 6.5 Security Analysis of FORS

FORS is a **few-time** scheme: it can safely sign a small number of messages before security degrades. The security analysis is based on the **target subset resilience** property.

**Target Subset Resilience:** An adversary who sees $q$ signatures cannot find a new message whose indices form a subset of the revealed indices.

The probability that a random message $M^*$ has all its $k$ indices covered by $q$ previous signatures is bounded by:

$$\Pr[\text{forgery}] \leq \binom{q \cdot k}{k} \cdot \left(\frac{k}{2^a}\right)^k \approx \left(\frac{q}{2^a}\right)^k$$

More precisely, the security loss from using FORS is:

$$\epsilon_{\text{FORS}} \leq \frac{q^k \cdot k^k}{2^{ak}} + k \cdot \epsilon_{\text{PRF}}$$

This is why SPHINCS+ uses **randomized message hashing** — to ensure that the adversary cannot choose which indices are revealed.

---

## 7. Merkle Trees and Authentication Paths

### 7.1 Binary Merkle Trees

A **Merkle tree** of height $h'$ has $2^{h'}$ leaves and $2^{h'+1} - 1$ nodes total. Given leaf values $L_0, L_1, \ldots, L_{2^{h'}-1}$:

**Internal node computation:**

$$\text{node}[i][j] = \mathsf{H}(\mathsf{PK.seed}, \mathsf{ADRS}_{i,j}, \text{node}[i-1][2j] \| \text{node}[i-1][2j+1])$$

where $i$ is the height (0 = leaves) and $j$ is the position at that height.

The **root** is $\text{node}[h'][0]$.

### 7.2 Authentication Paths

To prove that leaf $L_j$ is part of the tree with root $R$, one provides the **authentication path**:

$$\mathsf{AUTH} = (A_0, A_1, \ldots, A_{h'-1})$$

where $A_i$ is the sibling of the node on the path from $L_j$ to the root at height $i$.

**Verification:** Starting from $\text{node} = L_j$:

$$\text{For } i = 0 \text{ to } h'-1:$$
$$\text{node} = \begin{cases} \mathsf{H}(\mathsf{PK.seed}, \mathsf{ADRS}, \text{node} \| A_i) & \text{if bit } i \text{ of } j = 0 \\ \mathsf{H}(\mathsf{PK.seed}, \mathsf{ADRS}, A_i \| \text{node}) & \text{if bit } i \text{ of } j = 1 \end{cases}$$

Accept if $\text{node} = R$.

**Authentication path size:** $h' \cdot n$ bytes.

### 7.3 XMSS Trees (eXtended Merkle Signature Scheme)

Within SPHINCS+, each layer of the hypertree uses an **XMSS tree** — a Merkle tree whose leaves are WOTS+ public keys.

An XMSS tree of height $h' = h/d$ can sign exactly $2^{h/d}$ messages (one per leaf/WOTS+ key pair).

**XMSS Key Generation:**
1. Generate $2^{h/d}$ WOTS+ key pairs: $(\mathsf{sk}_i^{\text{WOTS+}}, \mathsf{pk}_i^{\text{WOTS+}})$ for $i = 0, \ldots, 2^{h/d}-1$
2. Build a Merkle tree over the WOTS+ public keys
3. The XMSS public key is the Merkle root

**XMSS Signing (for index $i$):**
1. Sign the message with WOTS+ key pair $i$: $\sigma_{\text{WOTS+}}$
2. Provide the authentication path $\mathsf{AUTH}$ for leaf $i$

**XMSS Signature:** $(\sigma_{\text{WOTS+}}, \mathsf{AUTH})$

**XMSS Verification:**
1. Verify WOTS+ signature → recover WOTS+ public key $\mathsf{pk}^{\text{WOTS+}}$
2. Use $\mathsf{AUTH}$ to recompute the Merkle root
3. Compare with the known XMSS public key

---

## 8. Hypertree Structure

The **hypertree** is the central innovation that makes SPHINCS+ **stateless**. It is a $d$-layer structure of XMSS trees, where each layer's trees are used to sign the roots of the trees in the layer below.

### 8.1 Architecture

```
Layer d-1 (top):    [    XMSS Tree (root = PK)    ]
                              |
Layer d-2:          [ XMSS ] [ XMSS ] ... [ XMSS ]
                              |
...                          ...
                              |
Layer 1:            [many XMSS trees]
                              |
Layer 0 (bottom):   [2^(h - h/d) XMSS trees]
                              |
                    [FORS trees for each leaf]
```

**Total number of XMSS trees per layer $i$:** $2^{i \cdot h/d}$

**Total number of leaves (FORS instances):** $2^h$

### 8.2 Index Decomposition

Given a leaf index $\text{idx} \in \{0, 1, \ldots, 2^h - 1\}$, decompose it as:

$$\text{idx} = (\text{tree}_d, \text{tree}_{d-1}, \ldots, \text{tree}_1, \text{leaf}_0)$$

where each $\text{tree}_i \in \{0, \ldots, 2^{h/d} - 1\}$ identifies which tree at layer $i$ to use, and $\text{leaf}_0$ identifies the leaf within the bottom-layer tree.

More precisely:
- $\text{leaf}_0 = \text{idx} \mod 2^{h/d}$ — leaf index in the bottom XMSS tree
- $\text{tree}_1 = \lfloor \text{idx} / 2^{h/d} \rfloor \mod 2^{h/d}$ — which tree at layer 1
- $\text{tree}_i = \lfloor \text{idx} / 2^{i \cdot h/d} \rfloor \mod 2^{h/d}$ — which tree at layer $i$

### 8.3 Hypertree Signing

**Input:** A FORS public key $\mathsf{pk}_{\text{FORS}}$ and a leaf index $\text{idx}$

**Process:**

For layer $i = 0$ to $d-1$:
1. Identify the XMSS tree at layer $i$ with index $\text{tree}_i$
2. Sign the input (FORS public key or previous layer's XMSS root) using WOTS+ key pair $\text{leaf}_i$ within that tree
3. Provide the XMSS authentication path

**Hypertree Signature:**

$$\sigma_{\text{HT}} = \left((\sigma_{\text{WOTS+}}^{(0)}, \mathsf{AUTH}^{(0)}), (\sigma_{\text{WOTS+}}^{(1)}, \mathsf{AUTH}^{(1)}), \ldots, (\sigma_{\text{WOTS+}}^{(d-1)}, \mathsf{AUTH}^{(d-1)})\right)$$

**Size:** $d \cdot (h/d + \ell) \cdot n = (h + d \cdot \ell) \cdot n$ bytes

### 8.4 Hypertree Verification

**Input:** $\mathsf{pk}_{\text{FORS}}$, $\text{idx}$, $\sigma_{\text{HT}}$, and the top-level public key $\mathsf{PK.root}$

**Process:**

Set $\text{node} = \mathsf{pk}_{\text{FORS}}$

For layer $i = 0$ to $d-1$:
1. Verify $\sigma_{\text{WOTS+}}^{(i)}$ on $\text{node}$ → recover WOTS+ public key $\mathsf{pk}_{\text{WOTS+}}^{(i)}$
2. Use $\mathsf{AUTH}^{(i)}$ to compute the root of the XMSS tree at layer $i$: $\text{node} \leftarrow \text{root}^{(i)}$

Accept if $\text{node} = \mathsf{PK.root}$

### 8.5 Why the Hypertree Enables Statelessness

In a standard XMSS scheme, the signer must maintain **state** — specifically, which leaf index has been used — to avoid reusing a WOTS+ key pair (which would be catastrophic for security).

SPHINCS+ avoids this by **deriving the leaf index pseudorandomly from the message and a secret random value**:

$$\text{idx} = \mathsf{H_{msg}}(R, \mathsf{PK.seed}, \mathsf{PK.root}, M)$$

where $R = \mathsf{PRF_{msg}}(\mathsf{SK.prf}, \mathsf{PK.seed}, M)$ is a per-message random value.

The probability of two messages mapping to the same leaf index is:

$$\Pr[\text{collision}] \leq \frac{Q^2}{2 \cdot 2^h}$$

where $Q$ is the number of signatures. For $h = 64$ and $Q = 2^{40}$ signatures, this probability is $\approx 2^{-45}$, which is negligible.

---

## 9. The Complete SPHINCS+ Scheme

### 9.1 Key Generation

```
SPHINCS+.KeyGen():
  SK.seed ←$ {0,1}^n        // Master secret seed
  SK.prf  ←$ {0,1}^n        // PRF key for randomization
  PK.seed ←$ {0,1}^n        // Public seed (domain separation)
  
  // Compute the top-level XMSS tree root
  PK.root = XMSS.root(SK.seed, PK.seed, layer = d-1, tree = 0)
  
  SK = (SK.seed, SK.prf, PK.seed, PK.root)
  PK = (PK.seed, PK.root)
  
  return (SK, PK)
```

The secret key is just **two random $n$-byte strings** plus the public key. Everything else is derived on-the-fly.

### 9.2 Signing

```
SPHINCS+.Sign(M, SK):
  // Step 1: Generate randomness
  R = PRF_msg(SK.prf, PK.seed, M)
  
  // Step 2: Compute message digest
  digest = H_msg(R, PK.seed, PK.root, M)
  
  // Step 3: Parse digest
  // First ka bits → FORS indices
  // Remaining bits → hypertree index
  (fors_digest, ht_index) = parse(digest)
  
  idx_tree = ht_index >> (h/d)    // which bottom-layer tree
  idx_leaf = ht_index & (2^(h/d) - 1)  // which leaf
  
  // Step 4: Sign with FORS
  σ_FORS = FORS.Sign(fors_digest, SK.seed, PK.seed, idx_tree, idx_leaf)
  pk_FORS = FORS.PKFromSig(σ_FORS, fors_digest, PK.seed, idx_tree, idx_leaf)
  
  // Step 5: Sign FORS public key with hypertree
  σ_HT = HT.Sign(pk_FORS, SK.seed, PK.seed, idx_tree, idx_leaf)
  
  // Step 6: Assemble signature
  σ = (R, σ_FORS, σ_HT)
  
  return σ
```

### 9.3 Verification

```
SPHINCS+.Verify(M, σ, PK):
  (R, σ_FORS, σ_HT) = σ
  (PK.seed, PK.root) = PK
  
  // Step 1: Recompute digest
  digest = H_msg(R, PK.seed, PK.root, M)
  
  // Step 2: Parse digest
  (fors_digest, ht_index) = parse(digest)
  idx_tree = ht_index >> (h/d)
  idx_leaf = ht_index & (2^(h/d) - 1)
  
  // Step 3: Recover FORS public key
  pk_FORS = FORS.PKFromSig(σ_FORS, fors_digest, PK.seed, idx_tree, idx_leaf)
  
  // Step 4: Verify hypertree signature
  result = HT.Verify(pk_FORS, σ_HT, PK.seed, PK.root, idx_tree, idx_leaf)
  
  return result
```

### 9.4 Signature Structure Summary

A complete SPHINCS+ signature $\sigma$ consists of:

| Component | Size |
|---|---|
| Randomness $R$ | $n$ bytes |
| FORS signature $\sigma_{\text{FORS}}$ | $k(a+1) \cdot n$ bytes |
| HT signature $\sigma_{\text{HT}}$ | $(h + d \cdot \ell) \cdot n$ bytes |
| **Total** | $(1 + k(a+1) + h + d\ell) \cdot n$ bytes |

---

## 10. Parameter Sets and Security Levels

### 10.1 NIST-Standardized Parameter Sets

SPHINCS+ defines parameter sets targeting three security levels. The naming convention is:

$$\text{SPHINCS+-}\{H\}\text{-}\{n \cdot 8\}\{s/f\}$$

where $H \in \{\text{SHA2}, \text{SHAKE}\}$, $n \cdot 8$ is the bit security level, and $s/f$ denotes small (signature size optimized) or fast (speed optimized).

#### Security Level 1 (AES-128 equivalent)

| Parameter | SPHINCS+-SHA2-128s | SPHINCS+-SHA2-128f |
|---|---|---|
| $n$ | 16 | 16 |
| $h$ | 63 | 66 |
| $d$ | 7 | 22 |
| $\log_2(w)$ | 12 | 6 |
| $k$ | 14 | 33 |
| $a$ | 12 | 6 |
| Sig. size | 7,856 bytes | 17,088 bytes |

#### Security Level 3 (AES-192 equivalent)

| Parameter | SPHINCS+-SHA2-192s | SPHINCS+-SHA2-192f |
|---|---|---|
| $n$ | 24 | 24 |
| $h$ | 63 | 66 |
| $d$ | 7 | 22 |
| $\log_2(w)$ | 14 | 8 |
| $k$ | 17 | 33 |
| $a$ | 14 | 8 |
| Sig. size | 16,224 bytes | 35,664 bytes |

#### Security Level 5 (AES-256 equivalent)

| Parameter | SPHINCS+-SHA2-256s | SPHINCS+-SHA2-256f |
|---|---|---|
| $n$ | 32 | 32 |
| $h$ | 64 | 68 |
| $d$ | 8 | 17 |
| $\log_2(w)$ | 14 | 9 |
| $k$ | 22 | 35 |
| $a$ | 14 | 9 |
| Sig. size | 29,792 bytes | 49,856 bytes |

### 10.2 Security Level Calculation

The **bit security** of SPHINCS+ is determined by the minimum of several attack complexities:

**Against FORS:**
$$\lambda_{\text{FORS}} = \min\left(ka, \frac{ka + \log_2 k}{2}\right)$$

(The second term accounts for multi-target attacks.)

**Against WOTS+:**
$$\lambda_{\text{WOTS+}} = n \cdot 8 - \log_2(\ell \cdot (w-1))$$

**Against the Merkle tree:**
$$\lambda_{\text{Merkle}} = n \cdot 8$$

**Against the hypertree (multi-target):**
$$\lambda_{\text{HT}} = n \cdot 8 - \log_2(h/d \cdot 2^{h/d})$$

The overall security level is:
$$\lambda = \min(\lambda_{\text{FORS}}, \lambda_{\text{WOTS+}}, \lambda_{\text{Merkle}}, \lambda_{\text{HT}})$$

### 10.3 The s vs. f Trade-off

The **small (s)** variants minimize signature size at the cost of slower signing:
- Larger $w$ → fewer hash chain steps per WOTS+ element → smaller $\ell$ → smaller signature
- But larger $w$ means longer chains → more computation

The **fast (f)** variants minimize signing time at the cost of larger signatures:
- Smaller $w$ → shorter chains → faster signing
- But smaller $w$ means larger $\ell$ → larger signature

The relationship between $w$ and performance:

$$\text{Signing time} \propto \ell \cdot w \approx \frac{8n}{\log_2 w} \cdot w = \frac{8n \cdot w}{\log_2 w}$$

This is minimized at $w = e \approx 2.718$, but practical values are powers of 2.

---

## 11. Security Proofs and Reductions

### 11.1 Overall Security Theorem

**Theorem (SPHINCS+ Security):** Let $\mathcal{A}$ be an EUF-CMA adversary against SPHINCS+ making at most $Q_s$ signing queries and $Q_h$ hash queries. Then:

$$\epsilon_{\text{SPHINCS+}} \leq \epsilon_{\text{FORS}} + \epsilon_{\text{HT}} + \frac{Q_s^2}{2^{h+1}}$$

where:
- $\epsilon_{\text{FORS}}$ is the security of FORS against target subset resilience attacks
- $\epsilon_{\text{HT}}$ is the security of the hypertree
- The last term accounts for index collision probability

### 11.2 Reduction Chain

The full security reduction proceeds as follows:

```
EUF-CMA security of SPHINCS+
        ↓ (reduction)
Target Subset Resilience of FORS
        ↓ (reduction)
Multi-target Second-Preimage Resistance of F
        ↓ (reduction)
Single-target Second-Preimage Resistance of H
```

And separately:

```
EUF-CMA security of Hypertree
        ↓ (reduction)
EUF-CMA security of XMSS
        ↓ (reduction)
EUF-CMA security of WOTS+
        ↓ (reduction)
Pseudorandomness of F
```

### 11.3 Multi-Target Security

A key concern in SPHINCS+ is **multi-target attacks**: since the scheme uses many hash function calls with different addresses, an adversary might attack multiple targets simultaneously.

For $T$ targets, a multi-target preimage attack costs $O(2^n / T)$ rather than $O(2^n)$. SPHINCS+ addresses this by:

1. **Domain separation via ADRS:** Each hash call has a unique address, making targets independent
2. **Parameter selection:** Choosing $n$ large enough that even with $T = 2^h$ targets, security holds:
$$\lambda_{\text{multi-target}} = n \cdot 8 - h$$

For $n = 32$ bytes and $h = 64$: $\lambda = 256 - 64 = 192$ bits. ✓

### 11.4 Quantum Security Analysis

In the **Quantum Random Oracle Model (QROM)**, the adversary can query $H$ in superposition. The key results are:

**Grover's algorithm** reduces preimage resistance from $O(2^n)$ to $O(2^{n/2})$.

**BHT algorithm** reduces collision resistance from $O(2^{n/2})$ to $O(2^{n/3})$.

SPHINCS+ counters this by:
- Using $n \geq 16$ bytes (128 bits), giving $2^{64}$ quantum preimage security
- Using $n \geq 32$ bytes (256 bits), giving $2^{128}$ quantum preimage security

The **QROM security proof** for SPHINCS+ (Bernstein et al., 2019) shows:

$$\epsilon_{\text{SPHINCS+}}^{\text{quantum}} \leq O\left(Q_h^2 \cdot 2^{-n \cdot 8 / 2}\right) + \epsilon_{\text{FORS}}^{\text{quantum}} + \epsilon_{\text{HT}}^{\text{quantum}}$$

### 11.5 Tight vs. Loose Reductions

One challenge in hash-based cryptography is that security reductions are often **loose** — the reduction loses a polynomial factor. For SPHINCS+:

$$\epsilon_{\text{SPHINCS+}} \leq \text{poly}(Q_s, Q_h, h, d, k, \ell) \cdot \epsilon_{\text{hash}}$$

The polynomial factor is manageable because:
1. The parameters are chosen to absorb this loss
2. The underlying hash functions (SHA-256, SHAKE256) have very small $\epsilon_{\text{hash}}$

---

## 12. Performance Analysis

### 12.1 Computational Complexity

**Key Generation:**
- Requires computing the entire top-level XMSS tree
- Number of hash calls: $O(2^{h/d} \cdot \ell + 2^{h/d+1})$
- Dominant cost: $2^{h/d}$ WOTS+ key generations

**Signing:**
- FORS signing: $O(k \cdot 2^a)$ hash calls (to compute authentication paths)
- WOTS+ signing per layer: $O(\ell \cdot w)$ hash calls
- XMSS authentication path per layer: $O(h/d)$ hash calls
- **Total:** $O(k \cdot 2^a + d \cdot (\ell \cdot w + h/d))$

**Verification:**
- FORS verification: $O(k \cdot a)$ hash calls
- WOTS+ verification per layer: $O(\ell \cdot w)$ hash calls
- XMSS path verification per layer: $O(h/d)$ hash calls
- **Total:** $O(k \cdot a + d \cdot (\ell \cdot w + h/d))$

### 12.2 Concrete Performance (Reference Implementation)

On a modern x86-64 processor (approximate values):

| Scheme | KeyGen | Sign | Verify | Sig. Size |
|---|---|---|---|---|
| SPHINCS+-SHA2-128s | 5.0 ms | 200 ms | 5.0 ms | 7,856 B |
| SPHINCS+-SHA2-128f | 0.5 ms | 10 ms | 0.5 ms | 17,088 B |
| SPHINCS+-SHA2-256s | 20 ms | 800 ms | 20 ms | 29,792 B |
| SPHINCS+-SHA2-256f | 2.0 ms | 40 ms | 2.0 ms | 49,856 B |
| ECDSA-256 (classical) | 0.1 ms | 0.1 ms | 0.2 ms | 64 B |

The signing time for SPHINCS+ is significantly higher than classical schemes, but verification is competitive.

### 12.3 Optimization Techniques

**Hypertree caching:** Pre-compute and cache the upper layers of the hypertree. Since the top $d'$ layers are reused across many signatures, caching their nodes reduces signing time at the cost of memory.

**WOTS+ optimization:** The chaining function can be parallelized since each of the $\ell$ chains is independent.

**Haraka hash function:** The Haraka variant of SPHINCS+ uses a specialized short-input hash function optimized for AES-NI instructions, achieving 2-5× speedup on supported hardware.

**Batch verification:** Multiple signatures can be verified in parallel, amortizing the cost of hash computations.

### 12.4 Comparison with Other PQC Signature Schemes

| Scheme | Basis | PK Size | SK Size | Sig. Size | Sign Time | Verify Time |
|---|---|---|---|---|---|---|
| SPHINCS+-128s | Hash | 32 B | 64 B | 7,856 B | ~200 ms | ~5 ms |
| CRYSTALS-Dilithium2 | Lattice | 1,312 B | 2,528 B | 2,420 B | ~0.1 ms | ~0.1 ms |
| Falcon-512 | Lattice | 897 B | 1,281 B | 666 B | ~0.5 ms | ~0.1 ms |
| XMSS (stateful) | Hash | 64 B | 64 B | 2,500 B | ~5 ms | ~1 ms |

SPHINCS+ has the **smallest public key** and **most conservative security assumptions** but pays a significant cost in signature size and signing time.

---

## 13. Conclusion

SPHINCS+ is a remarkable achievement in cryptographic engineering — a signature scheme whose security rests on nothing more than the collision resistance of a hash function, yet which achieves practical performance suitable for real-world deployment.

### 13.1 Summary of the Mathematical Architecture

The scheme is built in layers of increasing abstraction:

$$\underbrace{\mathsf{F}, \mathsf{H}, \mathsf{T}_\ell}_{\text{Tweakable hash functions}} \longrightarrow \underbrace{\text{WOTS+}}_{\text{One-time signatures}} \longrightarrow \underbrace{\text{XMSS trees}}_{\text{Few-time signatures}} \longrightarrow \underbrace{\text{Hypertree}}_{\text{Many-time, stateless}} \longrightarrow \underbrace{\text{FORS}}_{\text{Message compression}} \longrightarrow \underbrace{\text{SPHINCS+}}_{\text{Full scheme}}$$

Each layer adds a crucial property:
- **WOTS+** converts hash chain security into one-time signing
- **Merkle trees** aggregate many one-time keys into a single public key
- **XMSS** provides a few-time signature scheme with logarithmic overhead
- **The hypertree** extends XMSS to exponentially many signatures
- **FORS** compresses the message digest into a form suitable for the hypertree
- **Randomized hashing** ensures statelessness by making index collisions negligible

### 13.2 Key Mathematical Insights

1. **The checksum in WOTS+** is the elegant trick that prevents chain-advancement forgeries
2. **The hypertree decomposition** converts an exponentially large key space into a polynomial-depth tree
3. **Randomized message hashing** is the key to statelessness — it converts a stateful scheme into a stateless one with only a small security loss
4. **Domain separation via ADRS** ensures that the many hash calls throughout the scheme are all independent, preventing cross-context attacks
5. **The FORS few-time scheme** is carefully calibrated so that the probability of a successful subset attack is negligible given the randomized index selection

### 13.3 Open Problems and Future Directions

- **Tighter security reductions** in the QROM remain an active research area
- **Faster hash functions** (like Haraka) can dramatically improve performance
- **Threshold variants** of SPHINCS+ for distributed signing are being explored
- **Hybrid schemes** combining SPHINCS+ with lattice-based signatures offer both conservative security and practical performance

SPHINCS+ stands as a testament to the power of hash-based cryptography: by carefully composing simple, well-understood primitives, one can build a signature scheme that is simultaneously **provably secure**, **quantum-resistant**, and **practically deployable** — a true cornerstone of the post-quantum cryptographic landscape.

---

## References

- Bernstein, D. J., et al. (2019). *SPHINCS+: Submission to the NIST post-quantum project*. [https://sphincs.org](https://sphincs.org)
- Huelsing, A., et al. (2018). *XMSS: eXtended Merkle Signature Scheme*. RFC 8391.
- Merkle, R. C. (1989). *A certified digital signature*. CRYPTO 1989.
- Winternitz, R. S. (1984). *A secure one-way hash function built from DES*. IEEE Symposium on Security and Privacy.
- NIST (2024). *FIPS 205: Stateless Hash-Based Digital Signature Standard*.
- Bernstein, D. J., & Lange, T. (2017). *Post-quantum cryptography*. Nature, 549(7671), 188-194.
- Aumasson, J.-P., & Endignoux, G. (2017). *Improving Stateless Hash-Based Signatures*. CT-RSA 2018.

---

*This article covers the mathematical foundations of SPHINCS+ as standardized in FIPS 205. For implementation details, refer to the official SPHINCS+ specification and reference implementation at [https://sphincs.org](https://sphincs.org).*
