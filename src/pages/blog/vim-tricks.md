---
title: "Essential Vim Tricks"
date: "2024-03-27"
slug: "vim-tricks"
description: "A collection of useful Vim commands and shortcuts"
---

# Essential Vim Tricks

Here's a collection of Vim commands that I find particularly useful in my daily workflow.

## Navigation

The basics that every Vim user should know:

```vim
h - move left
j - move down
k - move up
l - move right
```

## Text Manipulation

Some powerful commands for editing:

- `dd` - delete current line
- `yy` - yank (copy) current line
- `p` - paste after cursor
- `ciw` - change inner word

## Advanced Features

### Macros

Recording and playing macros:

```vim
q{register} - start recording
q - stop recording
@{register} - play macro
```

> Pro tip: Use the dot command (.) to repeat your last change!

More Vim tips coming soon...