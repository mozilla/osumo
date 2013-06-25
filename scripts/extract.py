#!/usr/bin/python
import argparse
from datetime import datetime
import json
import os
import re
from StringIO import StringIO

from lxml import etree

LANGUAGES = [
  "bg",
  "cs",
  "de",
  "el",
  "en-US",
  "es",
  "eu",
  "fr",
  "ga-IE",
  "hr",
  "hu",
  "it",
  "ja",
  "mk",
  "my",
  "nl",
  "pl",
  "pt-BR",
  "ro",
  "ru",
  "sk",
  "sr",
  "th",
  "tr",
  "ur",
  "zh-CN",
  "zh-TW"
]

class LocaleString(object):
  def __init__(self, string, filename, linenum, comment=None):
    self.string = string
    self.filename = filename
    self.linenum = linenum
    self.comment = comment

  def po(self):
    s = []
    if self.comment:
      for line in self.comment:
        s.append("#. {}".format(line))

    s.append("#: {}:{}".format(self.filename, self.linenum))
    s.append("msgid {}".format(json.dumps(self.string)))
    s.append("msgstr {}".format(json.dumps("")))
    s.append("")
    s.append("")
    return "\n".join(s)

  def __repr__(self):
    return "<'{}' at {}:{}>".format(self.string, self.filename, self.linenum)

  def __hash__(self):
    return self.string.__hash__()

  def __eq__(self, other):
    return self.__hash__() == other.__hash__()

def get_line_num(s, i):
  return len(s[:i].split("\n"))

translate_expr = re.compile(r"\._\(\s*[\"'](.+?)[\"']\s*\)", flags=re.DOTALL)
def extract_from_js(f, fn):
  js = f.read()
  strings = set()
  for m in translate_expr.finditer(js):
    strings.add(LocaleString(m.group(1), fn, get_line_num(js, m.start())))
  return strings

def extract_from_html(f, fn):
  html = f.read()
  parser = etree.HTMLParser()
  tree = etree.parse(StringIO(html), parser)
  strings = set()
  for e in tree.xpath("//l10n") + tree.xpath("//*[@l10n]") + tree.xpath("//*[@class='l10n']"):
    strings.add(LocaleString(e.text, fn, get_line_num(html, html.find(e.text))))
  return strings

HEADER = """msgid ""
msgstr ""
"Project-Id-Version: 1\\n"
"Report-Msgid-Bugs-To: First Last <email@email.com> \\n"
"POT-Creation-Date: {}\\n"
"PO-Revision-Date: YEAR-MM-DD HH:MM\\n"
"Last-Translator: First Last <email@email.com>\\n"
"Language-Team: Team <team@email.com>\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"X-Generator: angular-l10n\\n"

""".format(datetime.now().isoformat())

def generate_po(strings):
  po = HEADER

  for string in strings:
    po += string.po()

  return po

def generate_json(strings):
  j = {}

  for string in strings:
    j[string] = ""

  return j

if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Extracts strings from html partials and JavaScript files.")
  parser.add_argument("directories", nargs="+", help="The directories that needs to be examined for translation strings.")
  parser.add_argument("-t", "--type", help="The type of the output to generate. Valid options are either 'po' or 'json'.", choices=["po", "json"], default="po")
  args = parser.parse_args()

  all_strings = set()
  for directory in args.directories:
    for root, d, files in os.walk(directory):
      for fname in files:
        with open(os.path.join(root, fname)) as f:
          if fname.endswith(".js"):
            strings = extract_from_js(f, os.path.join(root, fname))
          elif fname.endswith(".html") or fname.endswith(".htm"):
            strings = extract_from_html(f, os.path.join(root, fname))

        all_strings |= strings


  print "Parsing done! {} strings found.".format(len(all_strings))

  if args.type == "po":
    po = generate_po(all_strings)
    with open("locales/messages.pot", "w") as f:
      f.write(po)

    for language in LANGUAGES:
      try:
        os.mkdir(os.path.join("locales", language))
        os.mkdir(os.path.join("locales", language, "LC_MESSAGES"))
      except OSError:
        pass # Exists already

      fpath = os.path.join("locales", language, "LC_MESSAGES", "messages.po")
      try:
        with open(fpath):
          pass
      except IOError:
        with open(fpath, "w") as f:
          f.write(HEADER)

      command = "msgmerge -U locales/{}/LC_MESSAGES/messages.po locales/messages.pot".format(language)
      print command
      os.system(command)

  elif args.type == "json":
    raise NotImplementedError
