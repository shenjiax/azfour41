  
  function sliderChange(object) {// 滑块的值改变，运行这个函数
    var eContent = document.getElementById("e"+object.id.charAt(10));
    var osliderBlock = document.getElementById(object.id);//滑块的值
    eContent.value=osliderBlock.value;
    //滑块的值改变的话，滑块的值赋值给方框，实现动态变化
    var sum=0;
    for (var i=0; i<7; i++){
      var inputBox="e"+i;
      var inputBoxValue = document.getElementById(inputBox).value.trim();
      if (inputBoxValue===""){
        inputBoxValue=0;
      }
      sum+=parseFloat(inputBoxValue);
      console.log(sum);
    }

    if (sum>100){
      alert("exceed 100%");
      eContent.value=0;
      osliderBlock.value=0;
    }
  }



  function inputBoxChange(object) {

    var eContent = document.getElementById(object.id);

    if (isNaN(eContent.value.trim())){
       alert("input not a number");
       eContent.value=0;
       return;
    }

      if (eContent.value.trim()<0){
       alert("input lower than 0");
       eContent.value=0;
       return;
    }

    if (eContent.value==""){
       eContent.value=0;
       return;
    }

    var osliderBlock = document.getElementById("confidence"+object.id.charAt(1));//滑块的值

    var sum=0;
    for (var i=0; i<7; i++){
      var inputBoxValue = document.getElementById("e"+i).value.trim();
      if (inputBoxValue===""){
        inputBoxValue=0;
      }
      sum+=parseFloat(inputBoxValue);
    }

    if (sum>100){
      alert("exceed 100%");
      eContent.value=0;
      osliderBlock.value=0;
    }


    osliderBlock.value=eContent.value ;//将玩家总人数赋值给滑块的值，实现动态变化
    //callback(document.getElementById("confidence"+object.id));
  }
