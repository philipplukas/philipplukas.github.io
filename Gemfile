source "https://rubygems.org"

# Matches the toolchain GitHub Pages builds this repo with (legacy build,
# Jekyll 3.9.x), so a local preview and the deployed site agree.
#
#   bundle exec jekyll serve --drafts --livereload
#
gem "github-pages", group: :jekyll_plugins

# Ruby 3.4 removed these from the standard library; Jekyll 3.9 still expects
# them. Harmless on older Rubies, required here.
gem "csv"
gem "base64"
gem "bigdecimal"
gem "logger"
gem "erb"
gem "ostruct"

# Jekyll 3.9 does not pull in a web server of its own on modern Ruby.
gem "webrick"
