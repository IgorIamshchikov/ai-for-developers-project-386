class StaticController < ActionController::Base
  def fallback
    send_file Rails.root.join("public/index.html"), type: "text/html", disposition: "inline"
  end
end
