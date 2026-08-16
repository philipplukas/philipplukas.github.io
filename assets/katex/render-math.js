/* Render math with KaTeX on pages that set `math: true`.
 *
 * kramdown 2.x (the version GitHub Pages builds with) leaves $$…$$ as plain
 * LaTeX delimiters in the HTML rather than MathJax script carriers:
 *
 *   inline   \(F_1\)
 *   display  \[F_n = \frac{(2n-1)c}{4L}\]
 *
 * so the job is a delimiter scan, which is exactly what KaTeX's auto-render
 * extension does. `pre` and `code` are in auto-render's default ignore list,
 * so backslashes inside code blocks are left alone.
 */
(function () {
  'use strict';

  function render() {
    if (!window.renderMathInElement) return;

    var main = document.getElementById('main') || document.body;

    window.renderMathInElement(main, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      strict: false
    });

    // Display math arrives as a bare text node between block elements, so
    // KaTeX's own .katex-display carries the spacing; this only marks the
    // document as done for the stylesheet's benefit.
    document.documentElement.classList.add('math-rendered');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
