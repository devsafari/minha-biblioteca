var ecoFuturoApp;
$(document).ready(function() {
  'use strict';

  ecoFuturoApp = {
    init: function() {

      var self = this;

      this.setVideoSize();
      this.setMap();
      this.bindEvents();
      this.bindScroll();
      this.bindForms();
      this.fixBugs();
      this.GASetup();

      $("[data-modal]").on('click', function(ev) {
        ev.preventDefault();

        var target = $(this).data('modal-target');

        self.showModal(target);
      });
    },

    GASetup: function() {
      var self = this;
      $("[data-ga]").on('click', function(ev) {
        var data = $(this).data('ga');

        if(data) {
          var events = data.events ? data.events : [data]
          $.each(events, function(index,ev) {
            self.addGAEvent(ev);
          })
        }
      })
    },

    addGAEvent: function(ev_data) {
      var event_data;
      console.log("ev_data = %s", JSON.stringify(ev_data));
      if(ev_data.type == "pageview") {
        event_data = ev_data.data;
        ga('send','pageview',event_data);
      } else {
        event_data = {
          'hitType':  ev_data.type || 'event',
          'eventCategory': ev_data.category,
          'eventAction':ev_data.action,
          'eventLabel': ev_data.label,
          'eventValue': ev_data.value || null
        }
        ga('send', event_data);
      } 

      console.log("Enviando dados para [GA]")
      console.log(event_data);
    },

    fixBugs: function() {
      if (navigator.userAgent.match(/win(dows?)/ig)) {
          s = document.createElement('style');
          s.innerHTML = "section#home .header .text-header,section.section>article>header>h1{font-family:open_sansbold,sans-serif}section#sobre-o-projeto .box-about{font-family:open_sansbold,sans-serif}section#sobre-o-projeto article#boxes-wrapper .boxes .box header{font-family:open_sansbold,sans-serif}#oriente-se .boxes,.button,section#resultados .results-wrapper ul.results-counts li,section#resultados .results-wrapper ul.results-counts li.header{font-family:open_sansbold,sans-serif}footer.footer .footer-section section header>*{text-align:left;font-family:open_sansbold,sans-serif}.form .radio-wrapper label{top:1px;left:1px;right:1px;bottom:1px;cursor:pointer;font-family:open_sansbold,sans-serif}#signup_form .signup-steps-wrapper .signup_form .submit-field .back-button,#signup_form .signup-steps-wrapper .signup_form .submit-field input[type=submit],#signup_form>header>h1,.form .field-wrapper input[type=submit],.section.contact .contact-form-wrapper header{font-family:open_sansbold,sans-serif}";
          $('head').append(s);
      }
    },

    showModal: function(target) {
      var self = this;

      var modal = $('#modal'),
          width = modal.width();

      self.setBGMask(true, 0, '#modal');
      modal.css({'width':  width + 'px', 'left': '50%', 'margin-left':  -(width/2) + 'px' });

      $(".modal-content .inner-content").hide(function() {
        $(target).show();
        modal.fadeIn(function() {
          self.scrollTo(modal, undefined, function() {
            $("body,html").finish();
          })
        })
      })
    },

    bindForms: function() {
      var self = this;
      this.submitForm("#new_library_form", {
        pre_send: function(form) {
          var submit_btn = $("input[type='submit']", form).first();
          submit_btn.attr('disabled', 'disabled');
          submit_btn.attr('data-last-value', submit_btn.val());
          submit_btn.val("Enviando...");
        },
        success: function(form,data) {
          var submit_btn = $("input[type='submit']", form).first();
          $(form).slideUp();
          submit_btn.removeAttr('disabled');
          submit_btn.val(submit_btn.attr('data-last-value'));
          $("#signup_step_3").slideDown();
          self.addGAEvent({ type: "pageview", data: {page: '/inscreva-se/cadastro realizado'}});
        },
        error: function(form,data) {}
      }, true, undefined, false);

      this.submitForm("#contact_form", {
        success: function(){
          $("#contact_section").slideUp().remove();
        },
        error: function() {}
      }, true);

      $("#search_query").on('keydown', function() {
        if($(this).val() == '') {
          self.clearMarkers();
          self.createMarkersCluster(self.markers);
        }
      })

      this.submitForm("#search_form", {
        success: function(form,data) {
          if(data.success && data.total_records > 0) {

            var first_marker
            , markers = [];

            var ids = $.map(data.libraries, function(item,index) { return  item._id; })

            $.each(self.markers, function(index, marker) {
              var visible_marker = (ids.indexOf(marker.__id) != -1) 

              if(visible_marker) {
                markers.push(marker)
              }
              // set the position to center the map
              if(visible_marker && !first_marker) first_marker = marker;
            })

            var last_markers = self.markers;
            self.clearMarkers();
            self.markers = last_markers;

            self.createMarkersCluster(markers);

            if(first_marker) {
              self.map.setCenter(first_marker.position);
              self.map.setZoom(4);
            }
            self.setBGMask(false)
          } else {
            self.showNotification({message: 'Nenhuma biblioteca encontrada para sua busca', header: 'Opss :('}, 'error')
          }
        },
        error: function(form,data) {
          var error_data = {message: data.errors.query, header: 'Erro na busca'};
          self.showNotification(error_data, "error");
        }
      })
    },

    setBGMask: function(flag,delay, target) {
      var mask  = $("#background-mask")
      ,   method  = flag ? 'fadeIn' : 'fadeOut';

      mask.attr('data-target', target);
      if(method == 'fadeOut') { 
        $("#modal").hide();
      }
      return mask.delay(delay || 0)[method].call(mask, 'fast');
    },

    // Submit a form and call a callback function
    submitForm: function(form, callbacks, show_notification, request_type, clear_mask) {
      var self = this ;
      $(form).on("submit", function(ev) {
        ev.preventDefault();
        
        var form = $(this);
        var type = (request_type || form.attr('method') || "POST");

        if(callbacks.pre_send && typeof callbacks.pre_send == 'function') {
          callbacks.pre_send.call(null, form);
        }

        $.ajax({
          url:  $(form).attr("action"), 
          data: $(form).serialize() , 
          type: type , 
          dataType: "json",

          success: function(data) {
            //data = navigator.userAgent.match(/msie/i) ? $.parseJSON(data) : JSON.parse(data); 
            if(data.success) {
              if(callbacks.success) callbacks.success(form,data);   
            } else if (data.error) {
              if(callbacks.error) callbacks.error(form,data); 
            }

            if(show_notification) {
              if(data.error) {
                if(typeof data.errors == 'object')  {
                  var errors = Object.keys(data.errors).map(function(index) { return data.errors[index] });
                  var message_error = errors.map(function list(word) {
                    return "<li>" + word + "</li>";
                  }).join('');
                } else {
                  message_error = data.message;
                }
                data.message = ["<ul class='errors-messages'>" , message_error , "</li>"].join('')
                data.header  = 'Opss';
              } else if(data.success) {
                data.header = 'Sucesso!'
              }

              var _class = data.error ? "error" : "success" ;
              self.showNotification(data, _class);
            }
          },
          fail: function() {
            self.showNotification({message: 'Um erro ocorreu em nossos servidores. Por favor, tente novamente ou volte mais tarde.' , header: 'Erro interno'} , 'error', true);
          },
          complete: function () {
            if (clear_mask !== false) {
              self.setBGMask(false, 2000)
            }
          },
          beforeSend: function() {
            self.setBGMask(true);
          }
        });
      });
    },

    showNotification: function(data,_class, _timeout) {
      var self = this;

      self.formLogger = $("#form-logger");

      self.formLogger.removeAttr('class');
      self.formLogger.addClass(_class);

      self.formLogger.find('.message-header').html(data.header);
      self.formLogger.find('.message-body').html(data.message);

      self.formLogger.css({
        'margin-top': ( -(self.formLogger.height()/2)  + "px"), 
        'margin-left': ( -(self.formLogger.width()/2)  + "px" ),
        'position': 'fixed'
      });


      self.formLogger.fadeIn().animate({top: '50%', opacity: '1'}, function() {
        setTimeout(
          function() { 
            self.formLogger.animate({'top': '-50%'}, function() {
              $(this).css({'margin-top': '0'}).fadeOut('fast');
            })
        } , _timeout || 1000);
      });
    },

    setVideoSize:  function() {
      var ww             = $(window).width();
      var section_home   = $("section#home");
      var preview_video  = $("#preview-video");

      preview_video.show();
      
      if((ww < 1024) || !preview_video.is(":visible")) {
        section_home.removeAttr('style');
        preview_video.hide();
        return false;
      }
      var _height = (preview_video.height() + 'px');
      section_home.css('height', _height);
    },

    bindEvents: function() {
      var self = this;

      this.bindShareEvents();

      $(".scroll-button").on('click', function(ev) {
        ev.preventDefault();
        var target = $(this).data('target');
        self.scrollTo(target);
      });


      $(window).resize(function(){ self.setVideoSize(); });

      var preview_video = $("#preview-video-wrapper");

      if($.browser.mobile == true) {
        preview_video.remove();
      }

      $("#video-play").on("click",function(){
        var self  = $(this),
          video = $("#video");

        self.fadeOut("slow");
        var video_src = video.attr('src');
        video.attr('src', (video_src + '&autoplay=1'));

        $(".text-header,.share-text,.down-button","#home").delay(200).fadeOut("fast",function(){
          $("#video-wrapper").fadeIn(function() {
            if(preview_video.size() > 0) {
              preview_video.fadeOut();
            }
          });
        });
      });

      $("#background-mask").on('click', function() {

        var target = $($(this).data('target'));
        self.setBGMask(false);
        target.fadeOut();
      });

      this.bindMenu();
      this.bindContactForm();
      this.bindBoxes();
      this.bindSignupForm();
    },

    bindMenu: function() {
      var self = this;
      $("#main-menu, #footer-links").on('click', 'li > a', function(ev) {
        self.scrollTo($(this).attr('href') , 500);
      });
    },

    bindContactForm: function() {
      var self = this,
          maxSteps  = $("#contact_form .step").size();

      self.contactStep = 1;

      var previous_step_btn = $(".contact-form-wrapper #back-btn");
      previous_step_btn.fadeOut();

      $(".contact-form-toggle").on('click', function(ev) {
        ev.preventDefault();
        var form_section = $("#contact_section");
        form_section.slideToggle();
        var currentStep = $(".step#step_" + self.contactStep) ;

        // fadeToggle is not the better solution
        currentStep.fadeIn();

        self.scrollTo(form_section);
      });

      var _changeStep = function() {
        var thisStep = $(".step#step_" + self.contactStep);

        console.log(thisStep.attr('id'));

        thisStep.fadeOut(function() {
          var nextQuestion = $(".step#step_" + (self._previousContact ? --self.contactStep : ++self.contactStep) );

          console.log("next question id = %s", nextQuestion.attr('id'))
          console.log("contactStep = %s", self.contactStep)

          if(nextQuestion.size() > 0 && (self._previousContact ? self.contactStep >= 1 : self.contactStep <= maxSteps) ) {
            nextQuestion.fadeIn();
            if(self.contactStep > 1) { previous_step_btn.fadeIn(); } else { previous_step_btn.hide() ; }
            self._previousContact = false;
            self.scrollTo(nextQuestion);
          }
        })
      }

      $(".step input[type='radio']").on('change, click', function(ev) {
        _changeStep();
      });

      $(previous_step_btn).on('click', function(ev) {
        ev.preventDefault();
        self._previousContact = true;
        return _changeStep();
      })
    },

    bindSignupForm: function() {
      var self = this,
        signup_form = $("#signup_form");

      $("button.signup, a.signup").on('click', function() {
          self.setBGMask(true ,null, '#signup_form');
          self.scrollTo("#map-wrapper", undefined, function() {
            $("#new_library_form").fadeIn();
            $("#signup_step_3").fadeOut();
            signup_form.slideDown('fast');
          });
      });

      $("#signup_step_1").on('change', 'input[type="radio"]', function(ev) {
        var target = $("#signup_type"),
            that   = $(this),
            header = that.data('header'),
            type   = that.val();

        if(target.html() != header) {
          target.html(header);
        }
        $("[class*='signup_type_']", "#signup_form").hide();
        $(".signup_type_" + type).show();
      });
      
      /* $("select#library_city").on('change', function(ev) {
        var _method =  $(this).val() ? 'removeAttr': 'attr';
        var target  = $("#library_institution_name");
        target[_method].call(target,'disabled', '')
      }) */

      var autocomplete_wrapper = $("#autocomplete-wrapper"),
          autocomplete_list    = $("#autocomplete-results", autocomplete_wrapper),
          mouseover_autocomplete = false;

      autocomplete_list.hover(function() {
        mouseover_autocomplete = true
      }, function() {
        mouseover_autocomplete = false
      })

      $(autocomplete_list).on('click','li', function() {
        var self = $(this);

        $("#library_institution_name").val(self.data('value'))
        $("#library_school_id").val(self.data('id'));
        $(autocomplete_wrapper, autocomplete_list).fadeOut('fast');
        $("#signup_form").removeClass('autocomplete-opened');
      })

      var clearAutoCompleteResults = function() {
        autocomplete_list.children("li").remove();
      }

      var currentSchoolData = function() {
        var current_value = $("#library_institution_name").val(),
            state         = $("select#library_state").val(),
            city          = $("select#library_city").val();

        return {
          address: {city: {name: city}, district: {name: state}, number: "", street: city},
          label: "Cadastrar " + current_value,
          name: current_value
        }
      }

      var appendSchools = function(results) {
        var fragment = $(document.createDocumentFragment());

        $.each(results.schools, function(index, school) {
          var value_to_display = [school.label || school.name, " - ", school.address.street,", ",  school.address.district.name].join("")
          var li   = $(document.createElement('li')).attr({"data-id": school._id, "data-value": school.name });
          var span = $("<span />", {class: 'value', html: value_to_display }).appendTo(li);
          fragment.append(li);
        })

        return autocomplete_list.append(fragment);
      }

      var showAutoCompleteResults = function(results) {
        var signup_form = $("#signup_form"),
            autocompleted_opened_class = 'autocomplete-opened';

        clearAutoCompleteResults();

        if(results && results.success && results.count > 0) {
          
          signup_form.addClass(autocompleted_opened_class);
          autocomplete_list.fadeIn();
          results.schools.unshift(currentSchoolData())          

          appendSchools(results);
        } else {
          autocomplete_wrapper.fadeIn();
          autocomplete_list.fadeIn();
          return appendSchools({schools: [currentSchoolData()] });
        }
      }

      self.autoCompleteCache = {};

      $("#library_institution_name").on('blur', function(ev) {
        if(mouseover_autocomplete) {
          return false;
        }
        $("#signup_form").removeClass('autocomplete-opened');
        autocomplete_list.fadeOut();
      })

      var autocomplete_delay = Date.now();

      $("#library_institution_name").on('change keyup', function() {

        var state = $("select#library_state").val(),
            city  = $("select#library_city").val();
        
        if(!state) {
          return self.showNotification({message: 'Você deve selecionar o estado e a cidade antes de pesquisar a escola.', header: 'Ops...'}, 'error', 2000)
        } else if(!city) {
          return self.showNotification({message: 'Você deve selecionar uma cidade antes de pesquisar a escola', header: 'Ops...'}, 'error', 1600);
        }

        var _self = $(this),
            value = _self.val();

        if(value.length < 3) {
          return clearAutoCompleteResults();
        }

        var delay     = (Date.now() - autocomplete_delay)/1000;
        var _key      = [state, city, value].join("_");
        var has_cache = !!self.autoCompleteCache[_key];

        if(has_cache || delay >= 0.3) {

          autocomplete_delay         = Date.now();
          if(has_cache) {
            showAutoCompleteResults(self.autoCompleteCache[_key]);
          } else {
            $.get("/api/schools/autocomplete", {city: city, state: state, name: value}, function(data) {
              self.autoCompleteCache[_key] = data;
              showAutoCompleteResults(data);
            },"json")
          }

        } else {
          // debug
          // console.log("delay=%s", delay);
        }
      });

      $("#signup_step_1 input[type='radio']:checked").change();

        var states_cities = new dgCidadesEstados({
            estado: $(signup_form).find('.state-select').get(0),
            cidade: $(signup_form).find('.city-select').get(0)
        });
    },

    bindBoxes: function() {
      var wrapper = $("#boxes-wrapper"),
        bulletsNav = $("#boxes_nav"),
        arrow = $("#arrow_nav"),
        slideWrapper = $("#text-slide-wrapper"),
        slideNumber = 0;

      // slide-texts
      bulletsNav.on('click', 'li', function() {
        var index = $(this).index();

        slideMove(index);

        clearInterval(slideAutoPlay);
      });

      var slideMove = function(_index) {
        $("li", bulletsNav).removeClass('current');
        $("li", bulletsNav).eq(_index).addClass('current');

        var height = $("#slide-texts li.current").outerHeight();

        slideWrapper.css({height: height + 'px'});

        $("#slide-texts").css('position','relative').animate({top: -((_index * height)) }, 200);
      }

      var slidePlay = function() {
        slideMove(slideNumber++);

        if (slideNumber >= 3) {
          slideNumber = 0;
        }
      }

      //bulletsNav.find('li:first').click();
      slideMove(bulletsNav.find('li:first').index());

      var slideAutoPlay = setInterval(slidePlay, 8000);

      // boxes
      $(".box", wrapper).on("click", function() {
        var t   = $(this),
            index = t.index();

        if(t.hasClass('opened')) { return false; }
        var current = $(".opened", wrapper);
        current.removeClass('opened');
        $(this).addClass('opened');
       
        var positions = ['15%', '50%', '85%'];

        arrow.animate({left: positions[index]}, function(){ 
          var content = $("#box-desc-contents > ul.contents").find('> li').get(index);
          $("#desc-content").html($(content).html());
        });
      });

      $(".box.first").click();
    },

    scrollTo: function(target, speed, callback) {
      var _top = Math.max.apply(Math, [($(target).offset().top - 170),0]);

      $('html, body').animate({
          scrollTop: _top
      }, speed == undefined ? 1000 : speed, callback == undefined ? function() {} : callback);
    },

    bindShareEvents: function() {
      $('.facebook-share').on('click', function(ev) {
        ev.preventDefault();
        FB.ui({
          method: 'feed',
          link: CURRENT_HOST
        }, function(response){
        });
      });

      $("nav.banners .banner").on('click', 'a', function(ev) {
        ev.preventDefault();
        var self = $(this);
        $("article.embed-code").slideDown('fast', function() {
          $("#embed_code").html(self.parent('li').html().trim());
        })
      });

      var shareURL = "http://goo.gl/8oO9u8";

      $("#boxes-wrapper .share-icons").on('click', 'a', function(ev) {
        ev.preventDefault();
        var text = ''

        var self = $(this).parent('li'),
          twitter_text = "",
          facebook_text = "";
          //twitter_text = (text.slice(0,(text.length - 5) - shareURL.length) + "..." + shareURL);

        $("#desc-content ul > li").each(function(index, element) {
          text += ($(element).text().trim()) + " ";
        });

        text = text.replace(/\n/g, '').replace(/\s{5,}/g, '');

        var parent = $(this).parents('#boxes-wrapper');

        parent.find('.boxes li').each(function(index, element) {
          if ($('.boxes li').eq(index).hasClass('opened')) {
            switch(index) {
              case 0:
                facebook_text = "Conheça mais sobre os objetivos da campanha Eu Quero Minha Biblioteca.";
                twitter_text = "Conheça mais sobre os objetivos da campanha Eu Quero Minha Biblioteca em http://goo.gl/8oO9u8";
                break;
              case 1:
                facebook_text = "Saiba mais sobre a Lei 12.244/10, que garante o direito a biblioteca em todas as instituições de ensino do país.";
                twitter_text = "Saiba mais sobre a Lei 12.244/10, que garante o direito a biblioteca em todas as instituições de ensino do país. http://goo.gl/8oO9u8";
                break;
              case 2:
                facebook_text = "Saiba porque é tão importante ter biblioteca nas escolas.";
                twitter_text = "Saiba porque é tão importante ter biblioteca nas escolas http://goo.gl/8oO9u8";
                break
            }
          }
        });

        if(self.is('.facebook')) {
          FB.ui({
            method: 'feed',
            link: CURRENT_HOST,
            description: facebook_text
          }, function(response){
          });
        } else if (self.is('.google')) {
          var new_url = 'https://plus.google.com/share?url=' + shareURL;
          window.open(new_url, "_blank");
        } else if (self.is('.twitter')) {
          var new_url = ['http://twitter.com/home?status=', encodeURIComponent(twitter_text)].join('');
          window.open(new_url, "_blank");
        }
      })

      return false;
    },

    bindScroll: function() {

      var w = window, d = document, position , self = this ;

      var targetElements = $('[data-scroll-event]');

      self.targetedElements = [];

      $(w).on('scroll', function(ev){
        position = $(d).scrollTop();

        targetElements.each(function(index,element) {
          element = $(element); 
          var id = element.attr('id');

          var yaxis     = (element.offset().top + element.outerHeight()),
            inElement   = (position >= element.offset().top && position <= yaxis);

          if(position >= element.offset().top && (($.inArray(id, self.targetedElements) == -1) || element.data('force') == true && inElement)) {
            if(($.inArray(id, self.targetedElements) == -1)) { self.targetedElements.push(id); }
            var eventToCall = element.data('scroll-event');
            self[eventToCall].call(this);
          }
        })
      })
    },

    setMap: function() {
      var self = this;

          var mapOptions = {
        center: new google.maps.LatLng(-23.5919570,-46.6421130),
        zoom: 10,
        minZoom: 4,           
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        scrollwheel: false
          }

          var bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(-30.08649256719401, -72.44996435546875),
            new google.maps.LatLng(1.0666086607317062, -37.837531249999984)
          );

          self.map = new google.maps.Map(document.getElementById("search_map"), mapOptions);

          google.maps.event.addListener(self.map, 'dragend', function() {
        if (bounds.contains(self.map.getCenter())) return;

        var c = self.map.getCenter(),
          x = c.lng(),
          y = c.lat(),
          maxX = bounds.getNorthEast().lng(),
          maxY = bounds.getNorthEast().lat(),
          minX = bounds.getSouthWest().lng(),
          minY = bounds.getSouthWest().lat();

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;
        if (y < minY) y = minY;
        if (y > maxY) y = maxY;

        self.map.setCenter(new google.maps.LatLng(y, x));
      });

          self.infoWindows = [];
          self.markers = [];
          self.setMarkers();
          self.createMarkersCluster();
    },

    clearMarkers: function() {
      /* $.each(self.markers, function(index,marker) {
        marker.setMap(null);
      }) */
      this.markerCluster.clearMarkers();
    },

    getMarkersJSON: function(callback) {
      var self = this;
      if(self.libraries_data != undefined) {
        return callback.call(this, self.libraries_data)
      } else {
        $.getJSON('/api/libraries/?f=1', function(data) {
          if(data.success && data.total_records > 0) {
            self.initialMarkers = data.libraries;
            self.libraries_data = data;
          }
          return callback.call(this, data);
        });
      }
    },

    setMarkers: function(markers) {
      var self = this,
        markersPath = "/public/assets/images/markers",
        markersIcons = {
          "1":  [markersPath, "marker_people-mobilized.png"].join("/"),
          "2":  [markersPath, "marker_institutions.png"].join("/"),
          "3":  [markersPath, "marker_parliamentarians-candidates.png"].join("/")
        };

      self.initialMarkers = [];

      self.getCurrentLocation();

      var template = "<span class='name'>#name</span><br /> \
        <span class='occupation'>#occupation</span><br /><br /> \
        <span class='text'>Reinvindica uma biblioteca para:</span><br /><br /> \
        <span class='institucion_name'>#institution_name</span><br /> \
        <span class='address'>#address</span>";

      var addMarker = function(position, library) {
          var marker = new google.maps.Marker({
              position: position,
              map: self.map,
              title: library.name,
              icon: markersIcons[library.type],
              __type: library.type,
              __id: library._id
           });

          var content = template
            .replace("#name", library.name)
            .replace("#occupation", library.occupation)
            .replace("#institution_name", library.institution_name)
            .replace("#address", [library.address.city.name, library.address.state.uf].join(" - "))

            content = ["<div class='marker'><div class='marker-inner'>", content, "</div></div>"].join('');

          var infoWindow = new google.maps.InfoWindow({
            //content:  content,
            position: marker.getPosition(),
            width: '200px',
            height: '200px'
        });

          google.maps.event.addListener(marker, 'click', function() {
              infoWindow.open(self.map, marker);
              infoWindow.setContent(content);
          });       

          self.markers.push(marker);
          self.infoWindows.push(infoWindow);
      }

      var toGeocode = [],
          gmaps_geocoder = new google.maps.Geocoder();

      self.getMarkersJSON(function(data) {
        if(data && data.success) {
          $.each(data.libraries, function(index, library) {
                var _address  = library.address,
                  coordinates =  _address && _address.coordinates && _address.coordinates.lat && _address.coordinates.lng ? _address.coordinates : null;
                if(coordinates) {
                  var position = new google.maps.LatLng(coordinates.lat, coordinates.lng);
                  addMarker(position, library)
                } else {
                  // add to queue to be geocoded using google maps api (JS)
                  toGeocode.push(library);
                }
              });

          // geocode libraries with no previous coordinates configured
          $.each(toGeocode, function(index) {
            var library = toGeocode[index],
              address = library.address.formatted_address || library.address.user_address;

            gmaps_geocoder.geocode({'address': address}, function(results, status) {
              if(status == 'OK' && results && results.length > 0) {
                var first_result = results[0],
                  coordinates  = first_result.geometry.location,
                  position     = new google.maps.LatLng(coordinates.d || coordinates.lat, coordinates.e || coordinates.lng);

                addMarker(position, library);
              } 
            });
          });

          self.createMarkersCluster(self.markers);
        }
      });

      $("#markers-nav").on('click', 'li', function() {
        var t = $(this), type = t.data('type');
        $.each(ecoFuturoApp.infoWindows, function(index,infoWindow){
          infoWindow.close();
        })

        var last_markers = self.markers, markers = [];

        self.clearMarkers();
        self.markers = last_markers;

        $.each(self.markers, function(index,marker) {
          if(marker.__type == type) {
            markers.push(marker)
          }
        });

        self.createMarkersCluster(markers);
      });
    },

    createMarkersCluster: function(markers) {
      var self = this;
      return self.markerCluster = new MarkerClusterer(self.map, markers);
    },

    getCurrentLocation: function() {
      var self = this;
      try {
        navigator.geolocation.getCurrentPosition(function(response){ 
          if(response && response.coords) {
            var location = new google.maps.LatLng(response.coords.latitude, response.coords.longitude);
            self.map.setCenter(location);
            self.map.setZoom(10);
          }
        })
      } catch(e) {

      }
    },

    updateCounters: function() {
      var counters      = $(".results-counts .counter[data-value]"),
        countersValues  = {}, 
        values          = [];

      counters.each(function(i,e) { 
        e = $(e) ; 
        var val = parseFloat(e.data('value').toString().replace(/[\.,\,]/g,'')) ; 
        countersValues[e.attr('id')] = val; 
        values.push(val); 
      });

      if($(window).width() < 768) {
        counters.each(function(i,e) {
          e = $(e);
          e.html(countersValues[e.attr('id')])
        })
      } else {
        var maxValue = Math.max.apply(null, values),
          val    = 0;

        var interval = setInterval(function() {
          counters.each(function(index,element) {
            element     = $(element);
            val         = parseFloat(element.text());

            var destVal = countersValues[element.attr('id')]

            if(val < destVal) {
              val   = val+parseInt((15 * Math.random()));
              element.html(val > destVal ? destVal : val);
            }
            if(val >= maxValue) { 
              clearInterval(interval); 
            }
          });
        }, 1);
      }
    },

    fixMenu: function() {
      if($(window).width() >= 1024) {
        $(this).css({'position': 'fixed', 'top':'0', 'left': '0', 'z-index': '1900'});
      }
      $('.parallax').scrolly();
    },

    showGoTopButton: function() {
      var self = ecoFuturoApp;

      if($(window).width() > 540) {
        $("button#go-top").fadeIn(function() {
          $(this).on('click', function() {
            self.scrollTo("#home", null, function() {
              $('html, body').finish();
            });
          });
        });
      }
    },

    hideGoTopButton: function() {
      $("button#go-top").fadeOut();
    },

    dFieldLibrary: function(obj){
      var value = obj.value;
      if(value==2){
        $("#field-library-institution-name").css('display', 'none');
      } else {
        $("#field-library-institution-name").css('display', 'block');
      }
    },

    clickSignup: function(){
      $("#cad-signup").click();
    }
  }
  ecoFuturoApp.init();
})
