{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {

  packages = [
    pkgs.python312
    pkgs.poetry
    pkgs.git
  ];

  shellHook = ''
    poetry install --no-root
    source .venv/bin/activate
  '';
}
