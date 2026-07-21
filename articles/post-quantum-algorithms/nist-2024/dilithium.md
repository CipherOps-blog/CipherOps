# Dilithium

## Overview

Dilithium is a digital signature scheme based on the hardness of the **Module Learning With Errors (MLWE)** and **Module Short Integer Solution (MSIS)** problems. It was standardized by NIST in 2024 under the name **ML-DSA (FIPS 204)**.

## Core Idea

Dilithium uses a "Fiat-Shamir with aborts" approach over module lattices to produce compact and efficient signatures. It is designed to be simple to implement securely.

## Variants

| Variant | Security Level | Signature Size |
|---|---|---|
| Dilithium2 | AES-128 | 2420 bytes |
| Dilithium3 | AES-192 | 3293 bytes |
| Dilithium5 | AES-256 | 4595 bytes |

*More detailed content coming soon.*
