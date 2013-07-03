#!/bin/bash

git rev-parse HEAD > commit.txt
yes n | stackato update
