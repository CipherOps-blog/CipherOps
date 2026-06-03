# BIKE: Bit Flipping Key Encapsulation

BIKE is a post-quantum Key Encapsulation Mechanism submitted to the NIST Post-Quantum Cryptography standardization process. It is built on the hardness of decoding Quasi-Cyclic Moderate Density Parity-Check codes, a well-studied problem in coding theory with no known quantum speedup beyond Grover's algorithm.

## What Problem Does BIKE Solve?

Classical key exchange protocols such as RSA and ECDH rely on the hardness of factoring large integers or computing discrete logarithms. Both problems are efficiently solvable by a sufficiently powerful quantum computer running Shor's algorithm. BIKE is designed to remain secure even against such adversaries.

## How It Works

BIKE centers on bit-flipping decoding: a simple iterative algorithm that corrects errors in a noisy codeword by repeatedly flipping the bits most likely to be wrong, guided by the syndrome (the parity-check result). The private key is a sparse parity-check matrix; the public key hides that structure behind a dense product.

The suite offers three variants with different trade-offs:

- **BIKE-1** : fast key generation, larger public keys, no polynomial inversion required
- **BIKE-2** : compact public keys (half the size), systematic form, inversion-based keygen with batch optimization available
- **BIKE-3** : noisy syndrome decoding, follows the Ouroboros framework

All variants use ephemeral keys, meaning a fresh key pair is generated per session. This inherently defeats the GJS reaction attack, which requires observing many decryption failures under the same key.

## Security Basis

Security reduces to two hard coding-theory problems:
- **QC Syndrome Decoding** : finding a sparse error vector given its syndrome
- **QC Codeword Finding** : finding a low-weight codeword in a quasi-cyclic code

The best known classical and quantum attacks are variants of Information Set Decoding, a research direction dating back to Prange (1962) with only polynomial improvements over decades.

## Full Specification

The complete specification (parameter tables, performance benchmarks, Known Answer Tests, formal IND-CPA security proofs, and the asymptotic analysis of the bit-flipping decoder), is available in the paper below.

### This is a subsubsection

<div class="pdf-embed" data-src="articles/post-quantum-algorithms/BIKE.pdf"></div>
