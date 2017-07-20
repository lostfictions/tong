const fs = require('fs')
const path = require('path')

const DICT_OUT_PATH = '../data/flipdict.json'
const SYLLABLES_OUT_PATH = '../data/syllables.json'

const flipdict = fs.readFileSync(path.join(__dirname, '../data/flipdict.txt')).toString()
const dict = {}
const syllables = new Set()

flipdict.split('\n').forEach(line => {
  const phonemes = line.toLowerCase().split(' ')
  const word = phonemes.pop()
  let cursor = dict
  while(phonemes.length > 0) {
    const phon = phonemes.shift()
    syllables.add(phon)
    if(cursor[phon]) {
      const c = cursor[phon]
      if(typeof c === 'string') {
        //TODO: fix these exceptions
        console.log(c + ' uhh')
      }
      else {
        cursor = c
      }
    }
    else {
      const phons = {}
      cursor[phon] = phons
      cursor = phons
    }
  }
  cursor[word] = '!'
})

fs.writeFileSync(path.join(__dirname, DICT_OUT_PATH), JSON.stringify(dict))
fs.writeFileSync(path.join(__dirname, SYLLABLES_OUT_PATH), JSON.stringify([...syllables.values()]))
