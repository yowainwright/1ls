class Onels < Formula
  desc "1 line script - Lightweight JSON CLI with JavaScript syntax"
  homepage "https://github.com/yowainwright/1ls"
  version "0.0.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/yowainwright/1ls/releases/download/v#{version}/1ls-darwin-arm64"
      sha256 "PLACEHOLDER" # arm64
    else
      url "https://github.com/yowainwright/1ls/releases/download/v#{version}/1ls-darwin-x64"
      sha256 "PLACEHOLDER" # x64
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/yowainwright/1ls/releases/download/v#{version}/1ls-linux-arm64"
      sha256 "PLACEHOLDER" # linux-arm64
    else
      url "https://github.com/yowainwright/1ls/releases/download/v#{version}/1ls-linux-x64"
      sha256 "PLACEHOLDER" # linux-x64
    end
  end

  def install
    bin.install Dir["1ls-*"].first => "1ls"
  end

  test do
    output = shell_output("echo '{\"name\": \"test\"}' | #{bin}/1ls '.name'")
    assert_match "test", output
  end
end
