/**
 * 名前空間
 * OD.Calc
 */
var OD = OD || {};
OD.Calc = (function(){
  'use strict';

  var Calc = {};

  /**
   * @type string|number
   * input - 入力中の数字
   * current - 現在の計算結果
   * phase:0 - 数字入力
   * phase:1 - 演算子/イコール入力で計算する
   * phase:2 - イコール後 次の入力が数字ならAC
   */
  var state = {
    input : '',
    current : '',
    phase : 0,
    shortMemory : [],
    longMemory : []
  };

  var memory = [];
  var $elm = null;

  /**
   * 初期化
   */
  Calc.init = function() {

    var _this = this;

    /**
     * $elm代入
     * @type element
     */
    $elm = _this.elm = {
      mainView : $('#main-view'),
      subView : $('#sub-view'),
      ac : $('#ac'),
      bs : $('#bs'),
      equal : $('#equal'),
      num : $('.num'),
      point : $('.point'),
      operator : $('.operator')
    };

    /**
     * Attach event
     */
    $elm.num.on('click', function(elm) {
      _this.inputNum(elm);
    });

    $elm.point.on('click', function() {
      _this.inputPoint();
    });

    $elm.ac.on('click', function() {
      _this.allClear();
    });

    $elm.bs.on('click', function() {
      _this.backSpace();
    });

    $elm.operator.on('click', function(e) {
      _this.operator(e);
    });

    $elm.equal.on('click', function() {
      _this.equal();
    });

    Mousetrap.bind(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], function(e, key) {
      _this.inputNum(key);
    }).bind('.', function() {
      _this.inputPoint();
    }).bind(['+', '-', '*', '/'], function(e, key) {
      _this.operator(key);
    }).bind('=', function() {
      _this.equal();
    }).bind('c', function() {
      _this.allClear();
    });

  };

  /**
   * 計算処理の初期化
   */
  Calc.calc = function() {
    return this;
  };

  /**
   * 数字入力
   * @param {object|string}
   */
  Calc.inputNum = function(e) {
    var num = state.input;

    //イコール直後なら一度ACを挟む
    if(state.phase === 2) {
      this.allClear();
    }

    //クリックとキープレスで処理を分ける
    if(typeof e === 'object') {
      num += $(e.target).val();
    }
    else if(typeof e === 'string') {
      num += e;
    }

    //0の後に数字が続く場合は、先頭の0を消す
    state.input = num.replace(/^0([0-9])/,'$1');
    state.phase = 1;
    this.renderResult(state.input);
  };

  /**
   * 小数点入力
   * @param {element}
   */
  Calc.inputPoint = function() {
    var num = state.input;

    //イコール直後なら一度ACを挟む
    if(state.phase === 2) {
      this.allClear();
    }

    //既に小数点が含まれていれば return
    if(num.indexOf('.') >= 0) {
      return this;
    }

    num = num || '0';
    num += '.';
    state.input = num;

    state.phase = 1;
    this.renderResult(state.input);
  };

  /**
   * オペレーター入力
   * @param {element}
   */
  Calc.operator = function(e) {
    // console.log('operator｜input='+state.input+'｜current='+state.current+'｜phase='+state.phase);

    var operatorStr;

    //クリックとキープレスで処理を分ける
    if(typeof e === 'object') {
      console.log('object'+$(e.target).text());
      operatorStr = $(e.target).text();
    }
    else if(typeof e === 'string') {
      console.log('string'+ e);
      operatorStr = e;
    }

    state.input = state.input || '0';

    //最後が小数点なら少数点を省く
    if(state.input.slice(-1) === '.') {
      state.input = state.input.slice(0, -1);
    }

    state.current = (state.current === '') ? state.input : state.current;

    if(state.phase === 1) {
      this.calc().renderResult(state.current);
      state.input = '';
    }

    switch(operatorStr) {
      case '+':
        this.calc = function(){
          var currentNum = parseFloat(state.current) + parseFloat(state.input);
          state.current = currentNum + '';
          return this;
        };
        break;
      case '-':
        this.calc = function(){
          var currentNum = parseFloat(state.current) - parseFloat(state.input);
          state.current = currentNum + '';
          return this;
        };
        break;
      case '*':
        this.calc = function(){
          var currentNum = parseFloat(state.current) * parseFloat(state.input);
          state.current = currentNum + '';
          return this;
        };
        break;
      case '/':
        this.calc = function(){
          var currentNum = parseFloat(state.current) / parseFloat(state.input);
          state.current = currentNum + '';
          return this;
        };
        break;
    }

    this.renderSubView(operatorStr);

    state.phase = 0;
  };

  /**
   * イコール
   * return {object} this
   */
  Calc.equal = function() {
    if(state.phase === 1) {
      console.log('equal｜input='+state.input+'｜current='+state.current+'｜phase='+state.phase);
      state.current = (state.current === '') ? state.input : state.current;
      this.calc().renderSubView().renderResult(state.current);
      state.input = '';
      state.phase = 2;
    }
    return this;
  };

  /**
   * 一文字削除する
   */
  Calc.backSpace = function() {

    //TODO 消しても renderResult で追加されるため機能していない
    state.longMemory.pop();
    state.input = state.longMemory[state.longMemory.length - 1] || '0';
    return this.renderResult(state.input, 'bs');
  };

  /**
   * 表示を初期化する
   */
  Calc.allClear = function() {
    this.calc = function() {
      return this;
    };
    state.current = '';
    state.input = '';
    this.renderSubView().renderResult('0');
  };

  /**
   * 履歴を追加
   * @param {String}
   */
  Calc.addMemory = function(result) {

    //立て続けの0は履歴に入れない
    if (result === '0' && state.longMemory[state.longMemory.length - 1] === '0') {
      return;
    }

    state.shortMemory.push(result);
    state.longMemory.push(result);
    $('#memory').text(state.longMemory); //test
    return this;
  };

  /**
   * サブビューを更新する
   */
  Calc.renderSubView = function(opt_operatorStr) {
    var subText = opt_operatorStr || '';
    $elm.subView.text(subText);
    return this;
  };

  /**
   * 結果を更新する
   * @param {String}
   */
  Calc.renderResult = function(result) {
    // console.log(typeof result);
    this.addMemory(result);
    $elm.mainView.text(result);
    console.log('renderResult｜input='+state.input+'｜current='+state.current+'｜phase='+state.phase);
    return this;
  };

  return Calc;

  //TODO
  // ・CE対応
  // ・BS対応
  // ・履歴対応
  // ・モデルとビューコントロールに分離する？
  // キータイプ時にボタンを押したような表現を加える

})();

OD.Calc.init();
