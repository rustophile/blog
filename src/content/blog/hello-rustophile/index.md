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

## The first program

Every journey starts here:

```rust
fn main() {
    println!("Hello, world!");
}
```

And the first lesson the borrow checker teaches:

```rust
fn main() {
    let s = String::from("hello");
    let t = s;
    println!("{s}"); // error[E0382]: borrow of moved value: `s`
}
```

| Concept   | First impression     |
| --------- | -------------------- |
| Ownership | Strict, then obvious |
| Borrowing | Mostly fine          |
| Lifetimes | Ask me later         |
