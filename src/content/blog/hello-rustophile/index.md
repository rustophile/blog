---
title: "Hello, Rustophile"
description: "Why this blog exists and what to expect from it."
pubDate: 2026-10-08
tags: ["meta", "learning"]
---

This blog is a public notebook for learning Rust: what I read, what I build, and every place the compiler disagreed with me.

## What to expect

- **Notes** on the parts of the language that took more than one read: ownership, borrowing, lifetimes, traits.
- **Exercises** worked through from start to finish, including the wrong turns.
- **Small projects** built along the way.

> [!NOTE]
> Posts are written while learning, not after. Expect corrections in later posts.

The plan starts with [The Rust Programming Language](https://doc.rust-lang.org/book/), the book most people learn from, whose introduction sets the tone:

> Rust is for people who crave speed and stability in a language.
>
> — [The Rust Programming Language](https://doc.rust-lang.org/book/ch00-00-introduction.html)

## The first program

Every journey starts with `cargo new`, which writes two files:

```rust group="hello" tab="src/main.rs"
fn main() {
    println!("Hello, world!");
}
```

```toml group="hello" tab="Cargo.toml"
[package]
name = "hello"
version = "0.1.0"
edition = "2024"
```

```sh
cargo run
```

And the first lesson the borrow checker teaches:

```rust {3-4}
fn main() {
    let s = String::from("hello");
    let t = s;
    println!("{s}");
}
```

```ansi frame="terminal" title="cargo build"
error[E0382]: borrow of moved value: `s`
 --> src/main.rs:4:16
  |
2 |     let s = String::from("hello");
  |         - move occurs because `s` has type `String`, which does not implement the `Copy` trait
3 |     let t = s;
  |             - value moved here
4 |     println!("{s}");
  |                ^^^ value borrowed here after move
```

| Concept   | First impression     |
| --------- | -------------------- |
| Ownership | Strict, then obvious |
| Borrowing | Mostly fine          |
| Lifetimes | Ask me later         |
