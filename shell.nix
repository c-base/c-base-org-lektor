{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {

  packages = [
    pkgs.python312
    pkgs.poetry
    pkgs.git
  ];

  shellHook = ''
    poetry install
    source .venv/bin/activate
  '';
}
