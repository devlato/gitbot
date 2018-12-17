# Fake Activity Generator

A small script to generate fake activity. Can be run as a daemon. 


## Dependencies

To run this, you need Node.js (preferrably, 8.12.0 LTS) and npm. To install the dependencies, run the following command:

```sh
$ npm i
```


## Running the script

First, create a repo for a fake activity (it might be a private repo as well). Then make sure you've added your SSH key to your GitHub account. The scripts works with SSH access only (due to running in a non-interactive mode). Then just type:

```sh
$ npm start
```


