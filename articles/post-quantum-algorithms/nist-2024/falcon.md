# Falcon

## Overview

Falcon is a digital signature scheme based on the **NTRU lattice** framework and uses **GPV hash-and-sign** over NTRU lattices. It was standardized by NIST in 2024 under the name **FN-DSA (FIPS 206)**.

## Core Idea

Falcon achieves very compact signatures by leveraging the algebraic structure of NTRU lattices combined with a fast Fourier sampling technique. Its main trade-off is a more complex implementation compared to Dilithium.

## Variants

| Variant | Security Level | Signature Size |
|---|---|---|
| Falcon-512 | AES-128 | ~666 bytes |
| Falcon-1024 | AES-256 | ~1280 bytes |

*More detailed content coming soon.*
