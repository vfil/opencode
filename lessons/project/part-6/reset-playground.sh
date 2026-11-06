#!/bin/sh
# Recreates the playground folder the agent works in, exactly as Part 1 sets it up.
# Run it from this folder: sh reset-playground.sh
rm -rf playground
mkdir -p playground/notes
printf '# Playground\n\nA scratch folder for testing the agent.\n' > playground/README.md
printf '%s\n' "I have keys but no locks. I have space but no room. You can enter, but you can't go outside. What am I?" > playground/secret-file.txt
printf -- '- buy milk\n- water the plants\n' > playground/notes/todo.txt
