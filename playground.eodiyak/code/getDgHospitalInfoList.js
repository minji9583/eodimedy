var http = require('http')
var EndPoint = "http://apis.data.go.kr/B552657/HsptlAsembySearchService/"
var Operation = "getHsptlBassInfoInqire"
var ServiceKey = "K6sYWvqebVyngpczytPk5eOtSHyZapagbhcTDE31E6hsk57L5V8cJdQKn033Fvj4QU7m6jfDg7evWZLIgCHPBw%3D%3D"


var tmapkey = secret.get('tmapkey')
var tmapurl = 'https://apis.openapi.sk.com/tmap/routes'

let params = { version: 1 }

var treatmentList = new Array(
  "내과", "소아청소년과", "이비인후과",
  "안과", "치과", "피부과",
  "가정의학과", "산부인과", "비뇨기과",
  "외과", "정형외과", "성형외과",
  "흉부외과", "재활의학과", "응급의학과",
  "정신건강의학과", "신경과", "신경외과",
  "영상의학과", "치료방사선과", "핵의학과",
  "해부병리과", "임상병리과", "요양병원",
  "마취통증의학과", "구강악안면외과", "한의원"
)

//nearHospitalList ==> 근처병원 리스트
// dgidIdName ==> 찾으려는 병원 종류 // 내과, 외과....
//currentPosition ==> 현재 위치
module.exports.function = function getDgHospitalInfoList (nearHospitalList, dgName, currentPosition) {
  const console = require("console")
  var result = new Array() 
  console.log("====this is show time! ====")
  console.log(nearHospitalList)
  console.log(dgName)
  console.log(currentPosition)
  console.log("===========")

  for (let i = 0; i<nearHospitalList.length; i++){
    var url = EndPoint + Operation 
      + "?ServiceKey=" + ServiceKey 
      + "&HPID=" + nearHospitalList[i].hpid
      var details = http.getUrl(url,{format: 'xmljs'})
      var item = details.response.body.items.item
      console.log("tag : ",item)
      console.log(nearHospitalList[i])
      console.log("-------")

      // 사용자가 찾는 병원인가?
      var flag = false;
      if( item.dgidIdName != undefined){
        if(item.dgidIdName.includes(",")){
          var originDNList = item.dgidIdName.split(",");
          for(var k=0; k<originDNList.length; k++){
            if(originDNList[k] == dgName && item.dutyName.indexOf("요양병원")==-1) flag = true;
          }
        }else{
          if(item.dgidIdName == dgName && item.dutyName.indexOf("요양병원")==-1) flag = true;
        }
      }

      if (flag ) {
        console.log("this is item",item)
        var obj = new Object();
        let info = {}
        let url = ""
        info = {
          latitude : item.wgs84Lat,
          longitude : item.wgs84Lon,
          $id : null,
          $type : "viv.geo.GeoPoint"
        }

        var dgList = new Array();
        if(item.dgidIdName != undefined){
          originDNList = item.dgidIdName.split(",")
          for(var k=0; k<treatmentList.length; k++){
            if(item.dutyName.includes(treatmentList[k])){
              dgList[k] = true;
            }else{
              for(var j=0; j<originDNList.length; j++){
                if(treatmentList[k] == originDNList[j]){
                  dgList[k] = true;
                  break
                }else{
                  dgList[k] = false;
                }
              }
            }
          }
        }else{
          for(var k=0; k<25; k++){
            dgList.push(false);
          }
        }

        obj.point = info
        obj.dutyAddr = item.dutyAddr
        obj.dutyName = item.dutyName
        obj.dgidIdName = dgList
        obj.dutyTel1 = item.dutyTel1
        obj.startTime = nearHospitalList[i].startTime[0]
        obj.endTime = nearHospitalList[i].endTime[0]
        obj.currentPosition = currentPosition
        obj.distance = nearHospitalList[i].distance[0]
        obj.dutyDivName = nearHospitalList[i].dutyDivName[0]
        obj.dgName = dgName
        obj.mapUrl = item.dutyName

        url = 'https://search.naver.com/search.naver?query=' + item.dutyName
        obj.url = url

        console.log("url", url)
        console.log("obj", obj)

        let Startlat = currentPosition.latitude
        let Startlon = currentPosition.longitude

        let Endlat = item.wgs84Lat
        let Endlon = item.wgs84Lon

        let options = {
          format: 'json',
          headers: {
              appKey: tmapkey
          },
          query: {
              totalValue: 1,
              endX: Startlon, // 128
              endY: Startlat, // 36
              startX: Endlon,
              startY: Endlat,
          }
        }
        let tmapreq = http.postUrl(tmapurl, params, options).features[0].properties.totalTime
        obj.time = parseInt(tmapreq/60)
        result.push(obj);
    }
  }

  return result
}
