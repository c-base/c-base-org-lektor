{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {

  packages = [
    pkgs.python312
    pkgs.uv
    pkgs.git
  ];

  shellHook = ''
    uv pip install .
    source .venv/bin/activate
  '';
}
