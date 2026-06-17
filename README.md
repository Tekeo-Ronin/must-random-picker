# [Must Random Picker](https://tekeo-ronin.github.io/must-random-picker/)

A simple web tool that picks a random movie from your Mustapp Want list.

<img src="./assets/screenshot.png" alt="Must Random Picker screenshot" width="100%">

## Live site

https://tekeo-ronin.github.io/must-random-picker/

## What it does

Enter your Mustapp username or profile link, click **Pick random movie**, and the site will choose one random movie from your Want list.

You can then click **Open in Must** to open the selected movie on Mustapp.

## Features

* Works with a Mustapp username or profile link
* Picks a random movie from the Want list
* Shows movie title, year, runtime, and poster
* Opens the selected movie directly in Mustapp
* No login required

## Tech stack

* HTML
* CSS
* JavaScript

## How to use locally

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Note

This project uses public Mustapp profile data. It does not log in to Mustapp and cannot modify a user's Want or Watched lists.
